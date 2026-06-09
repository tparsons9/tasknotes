import { TFile, type TAbstractFile, normalizePath } from "obsidian";
import { parseLinkToPath } from "./linkUtils";
import { resolveIncludeFolders } from "../suggest/FileSuggestHelper";

interface ProjectTaskFolderRoutingApp {
	metadataCache?: {
		getFirstLinkpathDest?: (linkpath: string, sourcePath: string) => TFile | null;
	};
	vault?: {
		getAbstractFileByPath?: (path: string) => TAbstractFile | null;
	};
}

export interface ResolveProjectTaskFolderInput {
	app: ProjectTaskFolderRoutingApp;
	projects: readonly string[] | undefined;
	includeFolders: readonly string[] | undefined;
	activeFolder?: string;
	sourcePath?: string;
}

function normalizeFolderPath(path: string): string {
	return normalizePath(path).replace(/\/+$/, "");
}

function getParentFolder(path: string): string {
	return normalizeFolderPath(path).split("/").slice(0, -1).join("/");
}

function getWatchedRootForPath(
	projectPath: string,
	includeFolders: readonly string[],
	activeFolder?: string
): string | null {
	const normalizedProjectPath = normalizePath(projectPath);
	const resolvedFolders = resolveIncludeFolders(includeFolders, activeFolder);
	return (
		resolvedFolders.find((folder) => {
			const root = normalizeFolderPath(folder);
			if (!root) {
				return false;
			}
			return normalizedProjectPath.startsWith(`${root}/`);
		}) ?? null
	);
}

function isDirectChildOfWatchedRoot(projectPath: string, watchedRoot: string): boolean {
	return getParentFolder(projectPath) === normalizeFolderPath(watchedRoot);
}

function getProjectFile(
	app: ProjectTaskFolderRoutingApp,
	projectValue: string,
	sourcePath = ""
): TFile | null {
	const parsedPath = parseLinkToPath(projectValue);
	const linkpath = parsedPath.replace(/\.md$/i, "");
	const resolvedFile = app.metadataCache?.getFirstLinkpathDest?.(linkpath, sourcePath);
	if (resolvedFile) {
		return resolvedFile;
	}

	const candidates = [parsedPath, parsedPath.endsWith(".md") ? parsedPath : `${parsedPath}.md`];

	for (const candidate of candidates) {
		const file = app.vault?.getAbstractFileByPath?.(candidate);
		if (file instanceof TFile) {
			return file;
		}
	}

	return null;
}

export function resolveProjectTaskFolder({
	app,
	projects,
	includeFolders,
	activeFolder,
	sourcePath,
}: ResolveProjectTaskFolderInput): string | null {
	if (!projects || projects.length === 0 || !includeFolders || includeFolders.length === 0) {
		return null;
	}

	for (const project of projects) {
		if (typeof project !== "string" || project.trim().length === 0) {
			continue;
		}

		const projectFile = getProjectFile(app, project, sourcePath);
		if (!projectFile) {
			continue;
		}

		const watchedRoot = getWatchedRootForPath(projectFile.path, includeFolders, activeFolder);
		if (!watchedRoot || isDirectChildOfWatchedRoot(projectFile.path, watchedRoot)) {
			continue;
		}

		return getParentFolder(projectFile.path);
	}

	return null;
}
