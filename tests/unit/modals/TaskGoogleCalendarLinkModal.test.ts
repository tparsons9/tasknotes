import { TaskGoogleCalendarLinkModal } from "../../../src/modals/TaskGoogleCalendarLinkModal";
import type { TaskInfo } from "../../../src/types";

jest.mock("obsidian");

describe("TaskGoogleCalendarLinkModal", () => {
	it("ignores repeated create clicks while event creation is in flight", () => {
		const task: TaskInfo = {
			path: "Tasks/create-event.md",
			title: "Create event",
			status: "open",
			priority: "normal",
			scheduled: "2026-06-09",
			archived: false,
		};
		const plugin = {
			app: {},
			settings: {
				googleCalendarExport: {
					targetCalendarId: "primary",
				},
			},
			i18n: {
				translate: jest.fn((key: string) => key),
			},
			googleCalendarService: {
				getAvailableCalendars: jest.fn(() => [
					{
						id: "primary",
						summary: "Primary",
					},
				]),
			},
			taskCalendarSyncService: {
				isEnabled: jest.fn(() => true),
				taskToCalendarEvent: jest.fn(() => ({
					title: "Create event",
					start: { date: "2026-06-09" },
				})),
			},
		};
		let resolveCreate!: (created: boolean) => void;
		const createPromise = new Promise<boolean>((resolve) => {
			resolveCreate = resolve;
		});
		const onCreate = jest.fn(() => createPromise);
		const modal = new TaskGoogleCalendarLinkModal(plugin as any, {
			task,
			onCreate,
		});

		modal.open();
		const createButton = modal.contentEl.querySelector<HTMLButtonElement>(".mod-cta");

		expect(createButton).not.toBeNull();
		createButton?.click();
		createButton?.click();

		expect(onCreate).toHaveBeenCalledTimes(1);
		expect(createButton?.disabled).toBe(true);

		resolveCreate(false);
		return createPromise.then(() => {
			expect(createButton?.disabled).toBe(false);
		});
	});
});
