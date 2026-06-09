import { Modal, Notice, Setting } from "obsidian";
import TaskNotesPlugin from "../main";
import type { TaskInfo } from "../types";
import type {
	CreateLinkedGoogleCalendarEventOptions,
	TaskCalendarEventPayload,
} from "../services/TaskCalendarSyncService";
import type { ProviderCalendar } from "../services/CalendarProvider";

export interface TaskGoogleCalendarLinkModalOptions {
	task: TaskInfo;
	onCreate: (options: CreateLinkedGoogleCalendarEventOptions) => Promise<boolean>;
	submitLabel?: string;
	successMessage?: string;
}

export class TaskGoogleCalendarLinkModal extends Modal {
	private calendars: ProviderCalendar[] = [];
	private defaultEvent: TaskCalendarEventPayload | null = null;
	private calendarId = "";
	private createButton: HTMLButtonElement | null = null;
	private isSubmitting = false;

	constructor(
		private plugin: TaskNotesPlugin,
		private options: TaskGoogleCalendarLinkModalOptions
	) {
		super(plugin.app);
	}

	onOpen(): void {
		this.contentEl.empty();
		this.contentEl.addClass("tasknotes-plugin", "task-google-calendar-link-modal");
		this.titleEl.setText(this.plugin.i18n.translate("modals.googleCalendarLink.title"));

		if (!this.initializeDefaults()) {
			return;
		}

		this.renderControls();
	}

	private initializeDefaults(): boolean {
		if (!this.plugin.taskCalendarSyncService?.isEnabled()) {
			new Notice(
				this.plugin.i18n.translate(
					"settings.integrations.googleCalendarExport.notices.notEnabled"
				)
			);
			this.close();
			return false;
		}

		this.calendars = this.plugin.googleCalendarService?.getAvailableCalendars() ?? [];
		if (this.calendars.length === 0) {
			new Notice(this.plugin.i18n.translate("modals.googleCalendarLink.noCalendars"));
			this.close();
			return false;
		}

		this.defaultEvent = this.plugin.taskCalendarSyncService.taskToCalendarEvent(
			this.options.task
		);
		if (!this.defaultEvent) {
			new Notice(
				this.plugin.i18n.translate(
					"settings.integrations.googleCalendarExport.notices.noDateToSync"
				)
			);
			this.close();
			return false;
		}

		const targetCalendarId = this.plugin.settings.googleCalendarExport.targetCalendarId;
		this.calendarId =
			this.options.task.googleCalendarId ||
			(this.calendars.some((calendar) => calendar.id === targetCalendarId)
				? targetCalendarId
				: this.calendars[0].id);
		return true;
	}

	private renderControls(): void {
		if (!this.defaultEvent) {
			return;
		}

		new Setting(this.contentEl)
			.setName(this.plugin.i18n.translate("modals.googleCalendarLink.calendar"))
			.addDropdown((dropdown) => {
				for (const calendar of this.calendars) {
					dropdown.addOption(calendar.id, calendar.summary);
				}
				dropdown.setValue(this.calendarId);
				dropdown.onChange((value) => {
					this.calendarId = value;
				});
			});

		const buttonContainer = this.contentEl.createDiv("calendar-event-modal-buttons");
		buttonContainer
			.createEl("button", { text: this.plugin.i18n.translate("common.cancel") })
			.addEventListener("click", () => this.close());
		this.createButton = buttonContainer.createEl("button", {
			text:
				this.options.submitLabel ||
				this.plugin.i18n.translate("modals.googleCalendarLink.createButton"),
			cls: "mod-cta",
		});
		this.createButton.addEventListener("click", () => {
			void this.handleSubmit();
		});
	}

	private async handleSubmit(): Promise<void> {
		if (this.isSubmitting) {
			return;
		}

		if (!this.defaultEvent) {
			new Notice(this.plugin.i18n.translate("modals.googleCalendarLink.invalidEvent"));
			return;
		}

		this.isSubmitting = true;
		this.setCreateButtonDisabled(true);
		let created = false;
		try {
			created = await this.options.onCreate({
				calendarId: this.calendarId,
				eventData: this.defaultEvent,
			});
			if (created) {
				new Notice(
					this.options.successMessage ||
						this.plugin.i18n.translate("modals.googleCalendarLink.created")
				);
				this.close();
			}
		} finally {
			this.isSubmitting = false;
			if (!created) {
				this.setCreateButtonDisabled(false);
			}
		}
	}

	private setCreateButtonDisabled(disabled: boolean): void {
		if (this.createButton) {
			this.createButton.disabled = disabled;
		}
	}

	onClose(): void {
		this.createButton = null;
		this.contentEl.empty();
	}
}
