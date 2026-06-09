# TaskNotes - Unreleased

<!--

**Added** for new features.
**Changed** for changes in existing functionality.
**Deprecated** for soon-to-be removed features.
**Removed** for now removed features.
**Fixed** for any bug fixes.
**Security** in case of vulnerabilities.

Always acknowledge contributors and those who report issues.

Example:

```
## Fixed

- Fixed manual Google Calendar event creation so eligible tasks without a manual link do not receive calendar events through update or reconciliation sync paths.

- (#768) Fixed calendar view appearing empty in week and day views due to invalid time configuration values
  - Added time validation in settings UI with proper error messages and debouncing
  - Prevents "Cannot read properties of null (reading 'years')" error from FullCalendar
  - Thanks to @userhandle for reporting and help debugging
```

When a change has user-facing documentation, include a canonical tasknotes.dev link:

```
## Added

- Added materialized occurrence notes for recurring tasks. See [Recurring Tasks](https://tasknotes.dev/features/recurring-tasks/#materialized-occurrence-notes) for setup and calendar behavior.
```

-->

## Added

- Added a manual Google Calendar event creation mode for task exports. You can choose whether TaskNotes creates events automatically or only when requested from a task modal.

## Changed

- Updated the development build workflow for sandbox vault checkouts so `npm run build:test` builds the installed plugin in place.

## Fixed

- Fixed Google Calendar event creation so manual "Link on save" actions and repeated create clicks do not create duplicate events. The create task modal now closes without waiting for the Google Calendar event request to finish, and existing settings with automatic event creation disabled continue to show manual creation mode.
- Fixed manual Google Calendar linking so stale linked events are recreated on their selected calendar and edit-modal linking stops when unsaved task edits fail to save.
