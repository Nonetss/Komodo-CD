import type { ShikiConfig } from "astro"

type ShikiTheme = Exclude<ShikiConfig["theme"], string>

// Tema de Shiki con los tonos de sintaxis del bloque de código de la app
// (`--syntax-*` en apps/frontend/src/styles/global.css), pasados a hex
// porque Shiki los escribe tal cual en línea. El fondo es el de la terminal,
// para que siga al tema de la página.
const ink = {
  fg: "#f1f1ef",
  bg: "var(--terminal-bg)",
  muted: "#b7b5a9",
  subtle: "#7b7a74",
  flag: "#bface4",
  keyword: "#eaba83",
  url: "#8ac9dd",
  string: "#89d0aa",
  property: "#94bbea",
  placeholder: "#ff9955",
}

export const codeTheme: ShikiTheme = {
  name: "komodo-cd",
  type: "dark",
  settings: [
    { settings: { foreground: ink.fg, background: ink.bg } },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: ink.subtle },
    },
    {
      scope: ["punctuation", "meta.brace", "keyword.operator"],
      settings: { foreground: ink.muted },
    },
    {
      scope: ["keyword", "storage", "keyword.control"],
      settings: { foreground: ink.keyword, fontStyle: "bold" },
    },
    {
      scope: [
        "entity.name.command",
        "support.function",
        "entity.name.function",
      ],
      settings: { foreground: ink.fg, fontStyle: "bold" },
    },
    {
      scope: ["string", "punctuation.definition.string"],
      settings: { foreground: ink.string },
    },
    {
      scope: [
        "constant.numeric",
        "constant.language",
        "constant.other.option",
        "constant.character",
      ],
      settings: { foreground: ink.flag },
    },
    {
      scope: [
        "entity.name.tag",
        "support.type.property-name",
        "meta.mapping.key",
        "entity.other.attribute-name",
        "variable.other.property",
      ],
      settings: { foreground: ink.property },
    },
    {
      scope: [
        "variable",
        "variable.other",
        "punctuation.definition.variable",
        "meta.embedded",
      ],
      settings: { foreground: ink.placeholder },
    },
    {
      scope: ["markup.underline.link", "string.other.link"],
      settings: { foreground: ink.url },
    },
  ],
}
