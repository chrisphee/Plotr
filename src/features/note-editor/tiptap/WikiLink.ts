import { Node, mergeAttributes } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { useNotes } from "../../../stores/notesStore";
import { useNoteModal } from "../noteModalStore";

/* [[wiki-link]] — an inline atom referencing another note by id. The label is
   a snapshot of the title at insertion time. Typing "[[" opens a suggestion
   list of note titles; clicking a link opens that note's popup. */

export interface WikiLinkItem {
  id: string;
  title: string;
}

const suggestionKey = new PluginKey("wikiLinkSuggestion");

function noteItems(query: string): WikiLinkItem[] {
  const q = query.toLowerCase();
  return Object.values(useNotes.getState().notes)
    .filter((n) => n.title && n.title.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.title.localeCompare(b.title);
    })
    .slice(0, 8)
    .map((n) => ({ id: n.id, title: n.title }));
}

/* A dependency-free dropdown for the suggestion list. */
function createSuggestionRenderer(): ReturnType<
  NonNullable<SuggestionOptions<WikiLinkItem>["render"]>
> {
  let el: HTMLDivElement | null = null;
  let items: WikiLinkItem[] = [];
  let selected = 0;
  let command: ((item: WikiLinkItem) => void) | null = null;

  const paint = () => {
    if (!el) return;
    el.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "wikilink-menu__empty";
      empty.textContent = "No matching notes";
      el.appendChild(empty);
      return;
    }
    items.forEach((item, i) => {
      const row = document.createElement("button");
      row.className =
        "wikilink-menu__item" + (i === selected ? " wikilink-menu__item--active" : "");
      row.textContent = item.title;
      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        command?.(item);
      });
      el!.appendChild(row);
    });
  };

  const position = (rect: DOMRect | null) => {
    if (!el || !rect) return;
    el.style.left = `${Math.min(rect.left, window.innerWidth - 280)}px`;
    el.style.top = `${rect.bottom + 6}px`;
  };

  return {
    onStart(props) {
      el = document.createElement("div");
      el.className = "wikilink-menu";
      document.body.appendChild(el);
      items = props.items;
      selected = 0;
      command = (item) => props.command(item);
      paint();
      position(props.clientRect?.() ?? null);
    },
    onUpdate(props) {
      items = props.items;
      selected = Math.min(selected, Math.max(0, items.length - 1));
      command = (item) => props.command(item);
      paint();
      position(props.clientRect?.() ?? null);
    },
    onKeyDown(props) {
      if (props.event.key === "Escape") return true;
      if (props.event.key === "ArrowDown") {
        selected = (selected + 1) % Math.max(items.length, 1);
        paint();
        return true;
      }
      if (props.event.key === "ArrowUp") {
        selected = (selected - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1);
        paint();
        return true;
      }
      if (props.event.key === "Enter" || props.event.key === "Tab") {
        if (items[selected]) {
          command?.(items[selected]);
          return true;
        }
      }
      return false;
    },
    onExit() {
      el?.remove();
      el = null;
    },
  };
}

export const WikiLink = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      noteId: { default: null },
      label: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-wiki-link]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-wiki-link": "",
        "data-note-id": node.attrs.noteId,
        class: "wikilink",
      }),
      `${node.attrs.label}`,
    ];
  },

  renderText({ node }) {
    return `[[${node.attrs.label}]]`;
  },

  addProseMirrorPlugins() {
    return [
      Suggestion<WikiLinkItem>({
        editor: this.editor,
        pluginKey: suggestionKey,
        char: "[[",
        allowSpaces: true,
        items: ({ query }) => noteItems(query),
        render: createSuggestionRenderer,
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: "wikiLink", attrs: { noteId: props.id, label: props.title } },
              { type: "text", text: " " },
            ])
            .run();
        },
      }),
    ];
  },
});

/** Shared click handler: open the note a wiki-link points to. */
export function handleWikiLinkClick(target: EventTarget | null): boolean {
  const el = (target as HTMLElement | null)?.closest?.("[data-note-id]");
  if (!el) return false;
  const noteId = el.getAttribute("data-note-id");
  if (noteId && useNotes.getState().notes[noteId]) {
    useNoteModal.getState().open(noteId, "read");
    return true;
  }
  return false;
}
