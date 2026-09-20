/* TipTap JSON → Markdown, over the known Plotr node set. */

interface DocNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocNode[];
}

function renderText(node: DocNode): string {
  let t = node.text ?? "";
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        t = `**${t}**`;
        break;
      case "italic":
        t = `*${t}*`;
        break;
      case "underline":
        t = `<u>${t}</u>`;
        break;
      case "strike":
        t = `~~${t}~~`;
        break;
      case "code":
        t = `\`${t}\``;
        break;
      case "link":
        t = `[${t}](${String(mark.attrs?.href ?? "")})`;
        break;
    }
  }
  return t;
}

function renderInline(nodes: DocNode[] | undefined): string {
  return (nodes ?? [])
    .map((n) => {
      if (n.type === "text") return renderText(n);
      if (n.type === "wikiLink") return `[[${String(n.attrs?.label ?? "")}]]`;
      if (n.type === "hardBreak") return "  \n";
      if (n.type === "image") return `![](${String(n.attrs?.src ?? "")})`;
      return renderInline(n.content);
    })
    .join("");
}

function renderBlocks(nodes: DocNode[] | undefined, indent = ""): string {
  const out: string[] = [];
  for (const node of nodes ?? []) {
    switch (node.type) {
      case "paragraph":
        out.push(indent + renderInline(node.content));
        break;
      case "heading": {
        const level = Number(node.attrs?.level ?? 1);
        out.push(indent + "#".repeat(Math.min(6, level)) + " " + renderInline(node.content));
        break;
      }
      case "bulletList":
        out.push(
          (node.content ?? [])
            .map((li) => indent + "- " + renderBlocks(li.content, "").trim().replace(/\n\n/g, `\n${indent}  `))
            .join("\n"),
        );
        break;
      case "orderedList": {
        let n = Number(node.attrs?.start ?? 1);
        out.push(
          (node.content ?? [])
            .map((li) => indent + `${n++}. ` + renderBlocks(li.content, "").trim().replace(/\n\n/g, `\n${indent}   `))
            .join("\n"),
        );
        break;
      }
      case "taskList":
        out.push(
          (node.content ?? [])
            .map((li) => {
              const checked = li.attrs?.checked ? "x" : " ";
              return indent + `- [${checked}] ` + renderBlocks(li.content, "").trim();
            })
            .join("\n"),
        );
        break;
      case "blockquote":
        out.push(
          renderBlocks(node.content, "")
            .split("\n")
            .map((l) => indent + "> " + l)
            .join("\n"),
        );
        break;
      case "codeBlock":
        out.push(indent + "```\n" + renderInline(node.content) + "\n```");
        break;
      case "horizontalRule":
        out.push(indent + "---");
        break;
      case "image":
        out.push(indent + `![](${String(node.attrs?.src ?? "")})`);
        break;
      default:
        if (node.content) out.push(renderBlocks(node.content, indent));
    }
  }
  return out.filter((s) => s.length > 0).join("\n\n");
}

export function docToMarkdown(doc: unknown): string {
  return renderBlocks(((doc ?? {}) as DocNode).content);
}

/** A note as a standalone Markdown file. */
export function noteToMarkdown(title: string, doc: unknown, categories: string[]): string {
  const head = `# ${title || "Untitled note"}\n`;
  const cats = categories.length ? `\n> Categories: ${categories.join(", ")}\n` : "";
  return `${head}${cats}\n${docToMarkdown(doc)}\n`;
}
