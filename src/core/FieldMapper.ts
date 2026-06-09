import { FieldMapping, PriorityConfig, StatusConfig, TaskInfo } from "../types";
import type { UserMappedField } from "../types/settings";
import {
	isPropertyForField,
	lookupMappingKey,
	mapTaskFromFrontmatter,
	mapTaskToFrontmatter,
	toUserField,
	validateFieldMapping,
} from "./fieldMapping";

/**
 * Service for mapping between internal field names and user-configured property names
 */
export class FieldMapper {
	constructor(
		private mapping: FieldMapping,
		private userFields: UserMappedField[] = [],
		private statuses: readonly StatusConfig[] = [],
		private priorities: readonly PriorityConfig[] = []
	) {}

	/**
	 * Update user-defined field definitions (call when settings change)
	 */
	updateUserFields(fields: UserMappedField[]): void {
		this.userFields = fields;
	}

	/**
	 * Update status and priority definitions used to normalize values read
	 * directly from Obsidian properties or Bases.
	 */
	updateConfiguredValues(
		statuses: readonly StatusConfig[],
		priorities: readonly PriorityConfig[]
	): void {
		this.statuses = statuses;
		this.priorities = priorities;
	}

	/**
	 * Get current user-defined field definitions
	 */
	getUserFields(): UserMappedField[] {
		return [...this.userFields];
	}

	/**
	 * Convert internal field name to user's property name
	 */
	toUserField(internalName: keyof FieldMapping): string {
		if (internalName === "googleCalendarId") {
			return this.mapping.googleCalendarId;
		}
		return toUserField(this.mapping, internalName);
	}

	/**
	 * Convert frontmatter object using mapping to internal task data.
	 * User-defined fields (settings.userFields) are written as top-level properties
	 * on the returned object, keyed by their frontmatter key (e.g. "start_date").
	 */
	mapFromFrontmatter(
		frontmatter: unknown,
		filePath: string,
		storeTitleInFilename?: boolean
	): Partial<TaskInfo> {
		const frontmatterRecord =
			frontmatter !== null && typeof frontmatter === "object" && !Array.isArray(frontmatter)
				? (frontmatter as Record<string, unknown>)
				: undefined;
		const mapped = mapTaskFromFrontmatter(
			this.mapping,
			frontmatterRecord,
			filePath,
			storeTitleInFilename,
			this.userFields,
			this.statuses,
			this.priorities
		) as Partial<TaskInfo>;

		if (frontmatterRecord) {
			const googleCalendarId = frontmatterRecord[this.mapping.googleCalendarId];
			if (typeof googleCalendarId === "string") {
				mapped.googleCalendarId = googleCalendarId;
			} else if (
				typeof googleCalendarId === "number" ||
				typeof googleCalendarId === "boolean"
			) {
				mapped.googleCalendarId = String(googleCalendarId);
			}
		}

		return mapped;
	}

	/**
	 * Convert internal task data to frontmatter using mapping.
	 * User-defined fields are read from top-level task properties and written
	 * back to frontmatter using each field's configured frontmatter key.
	 */
	mapToFrontmatter(
		taskData: Partial<TaskInfo>,
		taskTag?: string,
		storeTitleInFilename?: boolean
	): Record<string, unknown> {
		const frontmatter = mapTaskToFrontmatter(
			this.mapping,
			taskData,
			taskTag,
			storeTitleInFilename,
			this.userFields
		);
		if (taskData.googleCalendarId !== undefined) {
			frontmatter[this.mapping.googleCalendarId] = taskData.googleCalendarId;
		}
		return frontmatter;
	}

	/**
	 * Update mapping configuration
	 */
	updateMapping(newMapping: FieldMapping): void {
		this.mapping = newMapping;
	}

	/**
	 * Get current mapping
	 */
	getMapping(): FieldMapping {
		return { ...this.mapping };
	}

	/**
	 * Look up the FieldMapping key for a given frontmatter property name.
	 *
	 * IMPORTANT: This returns the MAPPING KEY (e.g., "completeInstances"),
	 * NOT the frontmatter property name (e.g., "complete_instances").
	 *
	 * Use this to check if a property is recognized/mapped, but DO NOT use
	 * the returned key directly as a property identifier for TaskCard.
	 *
	 * @param frontmatterPropertyName - The property name from YAML (e.g., "complete_instances")
	 * @returns The FieldMapping key (e.g., "completeInstances") or null if not found
	 *
	 * @example
	 * // Given mapping: { completeInstances: "complete_instances" }
	 * lookupMappingKey("complete_instances") // Returns: "completeInstances"
	 * lookupMappingKey("unknown_field")      // Returns: null
	 */
	lookupMappingKey(frontmatterPropertyName: string): keyof FieldMapping | null {
		if (frontmatterPropertyName === this.mapping.googleCalendarId) {
			return "googleCalendarId";
		}
		return lookupMappingKey(this.mapping, frontmatterPropertyName);
	}

	/**
	 * Check if a frontmatter property name is a recognized/configured field.
	 * Returns true if the property has a mapping, false otherwise.
	 *
	 * @param frontmatterPropertyName - The property name from YAML
	 * @returns true if the property is recognized, false otherwise
	 */
	isRecognizedProperty(frontmatterPropertyName: string): boolean {
		return this.lookupMappingKey(frontmatterPropertyName) !== null;
	}

	/**
	 * Check if a property name matches a specific internal field.
	 * This handles user-configured field names properly.
	 *
	 * @param propertyName - The property name to check (could be user-configured or internal)
	 * @param internalField - The internal field key to check against
	 * @returns true if the propertyName is the user's configured name for this field
	 *
	 * @example
	 * // User has { status: "task-status" }
	 * isPropertyForField("task-status", "status") // true
	 * isPropertyForField("status", "status")      // false
	 *
	 * // User has { status: "status" } (default)
	 * isPropertyForField("status", "status")      // true
	 */
	isPropertyForField(propertyName: string, internalField: keyof FieldMapping): boolean {
		if (internalField === "googleCalendarId") {
			return propertyName === this.mapping.googleCalendarId;
		}
		return isPropertyForField(this.mapping, propertyName, internalField);
	}

	/**
	 * Convert an array of internal field names to their user-configured property names.
	 *
	 * @param internalFields - Array of FieldMapping keys
	 * @returns Array of user-configured property names
	 *
	 * @example
	 * // User has { status: "task-status", due: "deadline" }
	 * toUserFields(["status", "due", "priority"])
	 * // Returns: ["task-status", "deadline", "priority"]
	 */
	toUserFields(internalFields: (keyof FieldMapping)[]): string[] {
		return internalFields.map((field) => this.toUserField(field));
	}

	/**
	 * @deprecated Use lookupMappingKey() instead for clarity about what is returned
	 * Convert user's property name back to internal field name
	 * This is the reverse of toUserField()
	 */
	fromUserField(userPropertyName: string): keyof FieldMapping | null {
		return this.lookupMappingKey(userPropertyName);
	}

	/**
	 * Validate that a mapping has no empty field names
	 */
	static validateMapping(mapping: FieldMapping): { valid: boolean; errors: string[] } {
		return validateFieldMapping(mapping);
	}
}
