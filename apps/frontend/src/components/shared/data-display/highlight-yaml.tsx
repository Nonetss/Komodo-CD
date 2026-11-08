import type { ReactNode } from "react"

/** Expresiones de workflow (`${{ secrets.X }}`): lo que hay que definir */
const EXPRESSION = /(\$\{\{[^}]*\}\})/

/**
 * Resaltado de YAML de workflow (los pasos de GitHub Actions que se copian a
 * CI), con los mismos tonos `--syntax-*` que `highlightShell`: claves,
 * valores, URLs, la referencia de `uses:` y las expresiones `${{ … }}`.
 *
 * Línea a línea y sin dependencias: cubre los pasos que genera la propia app,
 * no YAML arbitrario.
 */
export function highlightYaml(code: string): ReactNode[] {
  return code.split("\n").flatMap((line, i) => {
    const nodes: ReactNode[] = i > 0 ? ["\n"] : []
    const m = line.match(/^(\s*)(-\s+)?([\w-]+)(:)(\s*)(.*)$/)
    if (!m) return [...nodes, line]
    const [, indent, dash, key, colon, gap, value] = m as string[]
    nodes.push(indent)
    if (dash) {
      nodes.push(
        <span key={`${i}-d`} className="text-code-foreground/60">
          {dash}
        </span>
      )
    }
    nodes.push(
      <span key={`${i}-k`} className="text-syntax-property">
        {key}
      </span>,
      <span key={`${i}-c`} className="text-code-foreground/60">
        {colon}
      </span>,
      gap
    )
    if (value) nodes.push(...highlightValue(key as string, value, i))
    return nodes
  })
}

function highlightValue(key: string, value: string, line: number) {
  return value.split(EXPRESSION).map((part, j) => {
    if (part === "") return null
    const k = `${line}-v${j}`
    if (j % 2 === 1) {
      return (
        <span key={k} className="text-syntax-placeholder">
          {part}
        </span>
      )
    }
    const tone =
      key === "uses"
        ? "text-syntax-keyword font-bold"
        : /^"?https?:\/\//.test(part)
          ? "text-syntax-url"
          : "text-syntax-string"
    return (
      <span key={k} className={tone}>
        {part}
      </span>
    )
  })
}
