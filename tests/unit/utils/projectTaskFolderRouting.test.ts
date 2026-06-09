import { TFile } from "../../__mocks__/obsidian";
import { resolveProjectTaskFolder } from "../../../src/utils/projectTaskFolderRouting";

function createApp(files: Record<string, TFile>) {
	return {
		metadataCache: {
			getFirstLinkpathDest: jest.fn((linkpath: string) => {
				const normalized = linkpath.replace(/\.md$/i, "");
				return files[linkpath] ?? files[`${normalized}.md`] ?? null;
			}),
		},
		vault: {
			getAbstractFileByPath: jest.fn((path: string) => files[path] ?? null),
		},
	};
}

describe("project task folder routing", () => {
	it("routes to the project note folder when the project is in a watched subfolder", () => {
		const project = new TFile("Projects/Course Alpha/Overview.md");
		const app = createApp({ "Projects/Course Alpha/Overview.md": project });

		const folder = resolveProjectTaskFolder({
			app,
			projects: ["[[Projects/Course Alpha/Overview]]"],
			includeFolders: ["Projects"],
		});

		expect(folder).toBe("Projects/Course Alpha");
	});

	it("does not route projects directly inside the watched root", () => {
		const project = new TFile("Projects/Overview.md");
		const app = createApp({ "Projects/Overview.md": project });

		const folder = resolveProjectTaskFolder({
			app,
			projects: ["[[Projects/Overview]]"],
			includeFolders: ["Projects"],
		});

		expect(folder).toBeNull();
	});

	it("uses the first matching project when multiple projects are present", () => {
		const first = new TFile("Projects/Course Alpha/Overview.md");
		const second = new TFile("Projects/Course Beta/Overview.md");
		const app = createApp({
			"Projects/Course Alpha/Overview.md": first,
			"Projects/Course Beta/Overview.md": second,
		});

		const folder = resolveProjectTaskFolder({
			app,
			projects: ["[[Projects/Course Alpha/Overview]]", "[[Projects/Course Beta/Overview]]"],
			includeFolders: ["Projects"],
		});

		expect(folder).toBe("Projects/Course Alpha");
	});

	it("resolves relative watched folders from the active note folder", () => {
		const project = new TFile("Work/Projects/Sprint 42/Plan.md");
		const app = createApp({ "Work/Projects/Sprint 42/Plan.md": project });

		const folder = resolveProjectTaskFolder({
			app,
			projects: ["[[Work/Projects/Sprint 42/Plan]]"],
			includeFolders: ["./Projects"],
			activeFolder: "Work",
		});

		expect(folder).toBe("Work/Projects/Sprint 42");
	});

	it("falls back when include folders are not configured", () => {
		const project = new TFile("Projects/Course Alpha/Overview.md");
		const app = createApp({ "Projects/Course Alpha/Overview.md": project });

		const folder = resolveProjectTaskFolder({
			app,
			projects: ["[[Projects/Course Alpha/Overview]]"],
			includeFolders: [],
		});

		expect(folder).toBeNull();
	});
});
