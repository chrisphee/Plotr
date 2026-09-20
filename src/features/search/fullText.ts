/* Full plain-text extraction from a TipTap JSON document, for search. */

interface DocNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
}

export function extractFullText(doc: unknown): string {
  const parts: string[] = [];
  const walk = (node: DocNode) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    if (node.type === "wikiLink") parts.push(String(node.attrs?.label ?? ""));
    for (const child of node.content ?? []) walk(child);
    if (node.type && node.type !== "doc") parts.push(" ");
  };
  walk((doc ?? {}) as DocNode);
  return parts.join("").replace(/\s+/g, " ").trim();
}
