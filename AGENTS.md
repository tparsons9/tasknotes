# TaskNotes - Agent Development Guide

This is an Obsidian plugin. The plugin ID is `tasknotes`.

## Personal Fork Context

This checkout is Tanner Parsons' personal fork of `callumalpass/tasknotes`.

- `origin` should point to `https://github.com/tparsons9/tasknotes.git`.
- `upstream` should point to `https://github.com/callumalpass/tasknotes.git` for fetches only. Do not push to upstream; keep the upstream push URL disabled if possible.
- Preserve the plugin ID `tasknotes` and name `TaskNotes` unless explicitly asked otherwise.
- Preserve the personal fork manifest metadata:
  - `author`: `Tanner Parsons`
  - `authorUrl`: `https://github.com/tparsons9`
- Prefer fork release versions that include a personal suffix, such as `4.11.0-tp.0`, to avoid colliding with upstream tags.
- Before preparing a fork release, fetch upstream and compare `upstream/main...main`. If upstream has moved, merge `upstream/main` first unless the user explicitly wants a release from the older base.

## Build & Test

```bash
# Build the plugin in place inside the sandbox vault's plugin directory
npm run build:test

# After building, reload the plugin in the running Obsidian instance
obsidian plugin:reload vault=sandbox id=tasknotes
```

Always run both commands after making changes. Obsidian must be running for the CLI to work.

## Useful Obsidian CLI Commands

```bash
# Check for JavaScript errors after reload
obsidian vault=sandbox dev:errors

# View console output
obsidian vault=sandbox dev:console

# Run JavaScript in the Obsidian context
obsidian vault=sandbox eval code="app.vault.getFiles().length"

# Take a screenshot to verify UI changes
obsidian vault=sandbox dev:screenshot path=screenshot.png

# Open developer tools
obsidian vault=sandbox devtools
```

## Other Build Commands

```bash
npm test              # Run unit tests (Jest)
npm run lint          # Lint source files
npm run typecheck     # TypeScript type checking only
npm run build         # Production build (without copying to vault)
```

Ensure all code changes pass linting checks. Do not weaken linting rules in order to get changes to pass. 

---

When you make changes, update docs/releases/unreleased.md. If your changes are related to a GitHub issue or PR, include acknowledgement of the individual who opened the issue or submitted the PR. Do not update unreleased.md for the addition of tests; unreleased.md is user-facing. 

You may update `.ops/` files locally as you work on items, but do not commit `.ops/` files. `.ops/` is local-only working state.

## Investigating issues

When investigating issues, you should try your best to reproduce them first. You can do a lot with the obsidian cli tool. If you have a theory about what is causing an issue, test that theory.

Not all reported issues will require changes to the code, and not all feature requests need to be implemented; Bases are very powerful, but can be difficult to navigate. If something is not working, or is being asked for, figure out if it is--or can be--achieved through Bases first.

## Prepare for a release. 

When asked to prepare for a release: 

1. Fetch upstream and check divergence with `git rev-list --left-right --count upstream/main...main`. If upstream is ahead, merge `upstream/main` before releasing unless the user says not to.
2. Choose a fork-safe version number. If upstream is on `4.11.0`, use a suffix like `4.11.0-tp.0` rather than `4.11.1`.
3. Run through the @I18N_GUIDE.md and make sure translations are up-to-date (and in their target language--not English placeholders). 
4. Make sure ALL `npm run test` tests are passing. 
5. Make sure there are no linting errors.
6. Make sure all items in @docs/releases/unreleased.md thank the correct issue/pr opener (double check), as well as those who have commented on the issue/pr. Make sure the copy is appropriate--it is user facing so it should not be overly technical. Make sure it is free from anything that resembles marketing copy. do not thank callumalpass 
7. Update `.ops` draft comments and matching Pickle requests for issues addressed in release notes but not yet closed. Start from the release notes, inspect each issue/comment thread individually, make sure `draft_issue_comment` and `draft_close_reason` are appropriate, create/update/cancel closeout Pickle requests as needed, and validate both `.ops` and `.ops/_pickle`. Do not commit `.ops/` files.
8. Move the body of unreleased.md to <VERSION NUMBER>.md, following the pattern of previous releases. Leave the comments that explain unreleased.md inside unreleased.md.
9. Update @manifest.json and @package.json. For this fork, keep `manifest.json` author metadata set to Tanner Parsons and `https://github.com/tparsons9`.
10. Run `npm run build:test`, then reload with `obsidian plugin:reload vault=sandbox id=tasknotes`, then check `obsidian dev:errors vault=sandbox`.
11. Commit changes as "release <VERSION NUMBER>".
12. Tag the commit. (Just version number, no 'v' prefix.)
13. Push `main` and the tag to `origin`.
14. Verify a GitHub release exists and is published. Installers cannot see draft release assets; a draft release can cause "manifest.json does not exist" even when the asset is attached.

If the release workflow does not run after pushing the tag, manually create a published release from the built assets:

```bash
gh release create <VERSION NUMBER> main.js manifest.json styles.css \
  --repo tparsons9/tasknotes \
  --title <VERSION NUMBER> \
  --notes-file docs/releases/<VERSION NUMBER>.md
```

If the workflow creates a draft release, publish it before testing installation:

```bash
gh release edit <VERSION NUMBER> --repo tparsons9/tasknotes --draft=false
```

Future improvement for this fork: add `workflow_dispatch` to `.github/workflows/release.yaml` so the release workflow can be run manually when tag pushes do not trigger it.
