export type Section = {
  key: string;
  title: string;
  sourceHint?: string;   // where original demo lived
  summary: string;       // what the section does now
};

export const SECTIONS: Section[] = [
  { key: "Layouts", title: "Layouts", sourceHint: "showcase/layout_basic.py", summary: "Layout demos now summarized for web/agent context." },
  { key: "Widgets", title: "Widgets", sourceHint: "showcase/formwidgets02.py", summary: "Form, list, tree, table, tab, textedit." },
  { key: "Pickers", title: "Pickers", sourceHint: "showcase/filepicker.py", summary: "File/Color/Text pickers." },
  { key: "Graphs",  title: "Graphs",  sourceHint: "showcase/graph.py", summary: "Graph examples -> share code blocks to chat." },
  { key: "Windows", title: "Windows", sourceHint: "showcase/windows.py", summary: "Window/flags examples described in chat." },
  { key: "Extra",   title: "Extra",   sourceHint: "showcase/dragndrop.py", summary: "Scroll areas, DnD, masks." }
];
