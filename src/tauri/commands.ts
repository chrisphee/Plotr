import { invoke, convertFileSrc } from "@tauri-apps/api/core";

export interface ProjectBundle {
  project_path: string;
  project: string;
  tree: string;
  trash: string;
  notes: string[];
  boards: string[];
}

export function createProject(
  parentDir: string,
  name: string,
  projectJson: string,
  treeJson: string,
): Promise<string> {
  return invoke("create_project", { parentDir, name, projectJson, treeJson });
}

export function loadProject(projectPath: string): Promise<ProjectBundle> {
  return invoke("load_project", { projectPath });
}

export function writeProjectFile(
  projectPath: string,
  relPath: string,
  contents: string,
): Promise<void> {
  return invoke("write_project_file", { projectPath, relPath, contents });
}

export function deleteProjectFile(projectPath: string, relPath: string): Promise<void> {
  return invoke("delete_project_file", { projectPath, relPath });
}

export function probeProject(projectPath: string): Promise<boolean> {
  return invoke("probe_project", { projectPath });
}

export interface AttachmentMeta {
  rel_path: string;
  file_name: string;
  size: number;
  mime: string;
}

export function importAttachment(
  projectPath: string,
  sourcePath: string,
): Promise<AttachmentMeta> {
  return invoke("import_attachment", { projectPath, sourcePath });
}

export function importAttachmentBytes(
  projectPath: string,
  fileName: string,
  bytes: number[],
): Promise<AttachmentMeta> {
  return invoke("import_attachment_bytes", { projectPath, fileName, bytes });
}

export function exportZip(projectPath: string, destZip: string): Promise<void> {
  return invoke("export_zip", { projectPath, destZip });
}

export function importZip(zipPath: string, destDir: string): Promise<string> {
  return invoke("import_zip", { zipPath, destDir });
}

export function writeExportFiles(
  destDir: string,
  files: { rel_path: string; contents: string }[],
): Promise<void> {
  return invoke("write_export_files", { destDir, files });
}

/** Spawns the repo's update script detached and exits the app. */
export function launchUpdate(): Promise<void> {
  return invoke("launch_update");
}

export function listProjectFiles(
  projectPath: string,
  subdir: "notes" | "boards" | "assets",
): Promise<string[]> {
  return invoke("list_project_files", { projectPath, subdir });
}

/** The one place asset-protocol URLs are built. `relPath` is "assets/…". */
export function assetUrl(projectPath: string, relPath: string): string {
  const sep = projectPath.includes("\\") ? "\\" : "/";
  const abs = projectPath.replace(/[\\/]+$/, "") + sep + relPath.replace(/\//g, sep);
  return convertFileSrc(abs);
}
