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

export interface ConnectorStatus {
  configured: boolean;
  connected: boolean;
  username: string | null;
}

export interface PinterestBoard {
  id: string;
  name: string;
  pin_count: number;
}

export interface PinterestPin {
  id: string;
  title: string;
  thumb_url: string;
  image_url: string;
}

export interface PinPage {
  items: PinterestPin[];
  bookmark: string | null;
}

export function pinterestConfigure(appId: string, appSecret: string): Promise<void> {
  return invoke("pinterest_configure", { appId, appSecret });
}

export function pinterestStatus(): Promise<ConnectorStatus> {
  return invoke("pinterest_status");
}

export function pinterestConnect(): Promise<ConnectorStatus> {
  return invoke("pinterest_connect");
}

export function pinterestDisconnect(): Promise<void> {
  return invoke("pinterest_disconnect");
}

export function pinterestListBoards(): Promise<PinterestBoard[]> {
  return invoke("pinterest_list_boards");
}

export function pinterestListPins(boardId: string, bookmark?: string | null): Promise<PinPage> {
  return invoke("pinterest_list_pins", { boardId, bookmark: bookmark ?? null });
}

export function pinterestImportPin(
  projectPath: string,
  imageUrl: string,
  pinId: string,
): Promise<AttachmentMeta> {
  return invoke("pinterest_import_pin", { projectPath, imageUrl, pinId });
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
