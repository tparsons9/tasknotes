import { describe, expect, it, jest } from "@jest/globals";
import { KanbanView } from "../../../src/bases/KanbanView";

function createKanbanView(userFields: any[]): KanbanView {
	const plugin = {
		settings: {
			userFields,
			customStatuses: [],
			customPriorities: [],
		},
		fieldMapper: {
			toUserField: jest.fn((key: string) => key),
			lookupMappingKey: jest.fn(() => null),
		},
		priorityManager: {
			getAllPriorities: jest.fn(() => []),
		},
	};

	return new KanbanView({}, document.createElement("div"), plugin as any);
}

describe("Kanban custom user field empty column augmentation", () => {
	it("adds missing preset columns when grouped by matching custom field key", () => {
		const view = createKanbanView([
			{
				id: "roadmap",
				displayName: "Roadmap",
				key: "roadmap",
				type: "text",
				values: ["backlog", "in-progress", "done"],
			},
		]);

		const groups = new Map<string, any[]>([["backlog", [{ path: "tasks/a.md" }]]]);
		(view as any).augmentWithEmptyCustomUserFieldColumns(groups, "note.roadmap");

		expect(groups.has("backlog")).toBe(true);
		expect(groups.has("in-progress")).toBe(true);
		expect(groups.has("done")).toBe(true);
		expect(groups.get("in-progress")).toEqual([]);
		expect(groups.get("done")).toEqual([]);
	});

	it("does not augment when groupBy property does not match a custom field key", () => {
		const view = createKanbanView([
			{
				id: "roadmap",
				displayName: "Roadmap",
				key: "roadmap",
				type: "text",
				values: ["backlog", "in-progress", "done"],
			},
		]);

		const groups = new Map<string, any[]>([["existing", []]]);
		(view as any).augmentWithEmptyCustomUserFieldColumns(groups, "note.status");

		expect(Array.from(groups.keys())).toEqual(["existing"]);
	});

	it("does not augment text/list fields when no kanban column presets are defined", () => {
		const view = createKanbanView([
			{
				id: "roadmap",
				displayName: "Roadmap",
				key: "roadmap",
				type: "text",
			},
				{
					id: "phase",
					displayName: "Phase",
					key: "phase",
					type: "list",
					values: [],
				},
			]);

		const textGroups = new Map<string, any[]>([["existing", []]]);
		(view as any).augmentWithEmptyCustomUserFieldColumns(textGroups, "note.roadmap");
		expect(Array.from(textGroups.keys())).toEqual(["existing"]);

		const listGroups = new Map<string, any[]>([["existing", []]]);
		(view as any).augmentWithEmptyCustomUserFieldColumns(listGroups, "note.phase");
		expect(Array.from(listGroups.keys())).toEqual(["existing"]);
	});

	it.each(["number", "boolean", "date"] as const)(
		"does not augment unsupported custom field type: %s",
		(type) => {
			const view = createKanbanView([
				{
					id: "custom",
					displayName: "Custom",
					key: "custom",
					type,
					values: ["one", "two"],
				},
			]);

			const groups = new Map<string, any[]>([["existing", []]]);
			(view as any).augmentWithEmptyCustomUserFieldColumns(groups, "note.custom");

			expect(Array.from(groups.keys())).toEqual(["existing"]);
		}
	);

	it("does not overwrite existing populated groups", () => {
		const view = createKanbanView([
			{
				id: "roadmap",
				displayName: "Roadmap",
				key: "roadmap",
				type: "text",
				values: ["backlog", "done"],
			},
		]);

		const existingDoneTasks = [{ path: "tasks/done.md" }];
		const groups = new Map<string, any[]>([["done", existingDoneTasks]]);

		(view as any).augmentWithEmptyCustomUserFieldColumns(groups, "note.roadmap");

		expect(groups.get("done")).toBe(existingDoneTasks);
		expect(groups.get("backlog")).toEqual([]);
	});

	it("supports legacy kanbanColumnValues for backward compatibility", () => {
		const view = createKanbanView([
			{
				id: "roadmap",
				displayName: "Roadmap",
				key: "roadmap",
				type: "text",
				kanbanColumnValues: ["backlog", "in-progress"],
			},
		]);

		const groups = new Map<string, any[]>([["done", []]]);
		(view as any).augmentWithEmptyCustomUserFieldColumns(groups, "note.roadmap");

		expect(groups.has("backlog")).toBe(true);
		expect(groups.has("in-progress")).toBe(true);
		expect(groups.has("done")).toBe(true);
	});
});
