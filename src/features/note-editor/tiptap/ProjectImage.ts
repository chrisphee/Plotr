import Image from "@tiptap/extension-image";
import { mergeAttributes } from "@tiptap/core";
import { useProject } from "../../../stores/projectStore";
import { assetUrl } from "../../../tauri/commands";

/* Inline images store project-relative "assets/…" paths in the document and
   resolve to asset-protocol URLs only at render time, so project folders
   stay portable. External http(s) URLs pass through untouched. */

export const ProjectImage = Image.extend({
  renderHTML({ node, HTMLAttributes }) {
    const src = String(node.attrs.src ?? "");
    let resolved = src;
    if (src.startsWith("assets/")) {
      const projectPath = useProject.getState().projectPath;
      if (projectPath) resolved = assetUrl(projectPath, src);
    }
    return ["img", mergeAttributes(HTMLAttributes, { src: resolved })];
  },
});
