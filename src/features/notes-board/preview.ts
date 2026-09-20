/* Extract a short plain-text preview from a TipTap JSON document. */

interface DocNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
}

const MAX = 160;

export function extractPreview(doc: unknown): string {
  const parts: string[] = [];
  let length = 0;

  const walk = (node: DocNode) => {
    if (length >= MAX) return;
    if (node.type === "text" && node.text) {
      parts.push(node.text);
      length += node.text.length;
      return;
    }
    if (node.type === "wikiLink") {
      const label = String(node.attrs?.label ?? "");
      parts.push(label);
      length += label.length;
      return;
    }
    for (const child of node.content ?? []) {
      walk(child);
      if (length >= MAX) return;
    }
    // Block boundary → space.
    if (node.type && node.type !== "doc" && parts.length && !parts[parts.length - 1].endsWith(" ")) {
      parts.push(" ");
    }
  };

  walk((doc ?? {}) as DocNode);
  const text = parts.join("").replace(/\s+/g, " ").trim();
  return text.length > MAX ? text.slice(0, MAX - 1) + "…" : text;
}
