import type { ReactNode } from "react"

type TokenKind =
  | "command"
  | "flag"
  | "keyword"
  | "url"
  | "string"
  | "property"
  | "punctuation"
  | "plain"

type Token = { kind: TokenKind; text: string }

/**
 * Tonos `--syntax-*` de poca saturación: cada tipo se distingue sin gritar.
 * El marcador a sustituir va en `warning`.
 */
const TONE: Record<TokenKind, string | undefined> = {
  command: "text-primary font-bold",
  flag: "text-syntax-flag",
  keyword: "text-syntax-keyword font-bold",
  url: "text-syntax-url",
  string: "text-syntax-string",
  property: "text-syntax-property",
  punctuation: "text-muted-foreground/70",
  plain: undefined,
}

/** Marcadores que el usuario debe sustituir, p. ej. `<tu-api-key>` */
const PLACEHOLDER = /(<[^<>\s]+>)/

/**
 * Resaltado de comandos de shell (los `curl` que se copian a CI).
 *
 * Recorre el texto como lo haría la shell: comando, flags, el método tras
 * `-X`, URLs y cadenas entre comillas. Las cadenas se abren un nivel más: una
 * cabecera `"nombre: valor"` separa nombre y valor, y un cuerpo `'{…}'` se
 * resalta como JSON. Los marcadores `<…>` destacan lo que hay que sustituir.
 *
 * Sin dependencias, como `JsonView` en console: cubre los comandos que genera
 * la propia app, no shell arbitraria.
 */
export function highlightShell(code: string): ReactNode[] {
  return lexShell(code).flatMap((token, i) =>
    token.text.split(PLACEHOLDER).map((part, j) => {
      if (part === "") return null
      const key = `${i}-${j}`
      if (j % 2 === 1) {
        return (
          <span key={key} className="text-warning">
            {part}
          </span>
        )
      }
      const tone = TONE[token.kind]
      return tone ? (
        <span key={key} className={tone}>
          {part}
        </span>
      ) : (
        part
      )
    })
  )
}

function lexShell(code: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  // Primera palabra de un comando (al inicio o tras una línea no continuada)
  let atCommand = true
  let continued = false
  let expectMethod = false

  while (i < code.length) {
    const ch = code[i] as string

    if (ch === "\\" && code[i + 1] === "\n") {
      tokens.push({ kind: "punctuation", text: "\\" })
      continued = true
      i++
      continue
    }

    if (ch === "\n") {
      tokens.push({ kind: "plain", text: ch })
      if (!continued) atCommand = true
      continued = false
      i++
      continue
    }

    if (ch === " " || ch === "\t") {
      let j = i + 1
      while (code[j] === " " || code[j] === "\t") j++
      tokens.push({ kind: "plain", text: code.slice(i, j) })
      i = j
      continue
    }

    if (ch === "'" || ch === '"') {
      const end = readQuotedEnd(code, i)
      tokens.push(...lexQuoted(code.slice(i, end)))
      atCommand = false
      expectMethod = false
      i = end
      continue
    }

    let j = i + 1
    while (j < code.length && !/[\s'"]/.test(code[j] as string)) j++
    const word = code.slice(i, j)

    if (atCommand) {
      tokens.push({ kind: "command", text: word })
      atCommand = false
    } else if (expectMethod) {
      tokens.push({ kind: "keyword", text: word })
      expectMethod = false
    } else if (word.startsWith("-")) {
      tokens.push({ kind: "flag", text: word })
      expectMethod = word === "-X" || word === "--request"
    } else if (/^https?:\/\//.test(word)) {
      tokens.push({ kind: "url", text: word })
    } else {
      tokens.push({ kind: "plain", text: word })
    }
    i = j
  }

  return tokens
}

function readQuotedEnd(code: string, start: number): number {
  const quote = code[start]
  let j = start + 1
  while (j < code.length) {
    const c = code[j]
    // Entre comillas simples la shell no interpreta escapes
    if (c === "\\" && quote === '"') {
      j += 2
      continue
    }
    if (c === quote) return j + 1
    j++
  }
  return j
}

/** Cadena entre comillas: cabecera `"nombre: valor"`, cuerpo JSON o texto. */
function lexQuoted(quoted: string): Token[] {
  const open = quoted[0] as string
  const closed = quoted.length > 1 && quoted.endsWith(open)
  const inner = quoted.slice(1, closed ? -1 : undefined)
  const close = closed ? open : ""

  if (/^\s*[{[]/.test(inner)) {
    return [
      { kind: "string", text: open },
      ...lexJson(inner),
      { kind: "string", text: close },
    ]
  }

  const header = inner.match(/^([\w-]+)(:\s*)([\s\S]*)$/)
  if (header) {
    return [
      { kind: "string", text: open },
      { kind: "property", text: header[1] as string },
      { kind: "punctuation", text: header[2] as string },
      { kind: "string", text: `${header[3]}${close}` },
    ]
  }

  return [{ kind: "string", text: quoted }]
}

function lexJson(text: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < text.length) {
    const ch = text[i] as string

    if (ch === '"') {
      const end = readQuotedEnd(text, i)
      let k = end
      while (text[k] === " " || text[k] === "\t") k++
      tokens.push({
        kind: text[k] === ":" ? "property" : "string",
        text: text.slice(i, end),
      })
      i = end
      continue
    }

    if ("{}[],:".includes(ch)) {
      tokens.push({ kind: "punctuation", text: ch })
      i++
      continue
    }

    const literal = text.slice(i).match(/^(-?\d[\d.eE+-]*|true|false|null)/)
    if (literal) {
      tokens.push({ kind: "keyword", text: literal[0] })
      i += literal[0].length
      continue
    }

    tokens.push({ kind: "plain", text: ch })
    i++
  }

  return tokens
}
