/**
 * Idempotently patches the installed `tailwint` so it waits for the Tailwind
 * language server to publish *settled* diagnostics for every opened file.
 *
 * Upstream 1.1.15 resolves as soon as the project initializes, which left
 * most files unscanned ("1/420 files received"). A first-pass wait until
 * every file had *a* publishDiagnostics still raced: the server often
 * publishes an empty set first, then the real conflicts/canonical warnings
 * a beat later — after tailwint had already reported "all clear" and begun
 * shutdown (second publish arriving alongside `projectsDestroyed`).
 *
 * Re-applied automatically by the `tailwind:check` / `tailwind:fix` scripts
 * before each run, so it survives a `bun install` that reverts the store.
 * Safe to run multiple times: a no-op once the patch is already in place, and
 * a silent skip when `tailwint` is not installed.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"

const ROOT = resolve(import.meta.dirname, "..")

const WAIT_SETTLE =
  "await we(m.predictedRoots,m.maxProjects);{const _t=Date.now();while(A.size<g&&Date.now()-_t<3e4){await new Promise(r=>setTimeout(r,200))}const _sig=()=>{let n=0;for(const x of A.values())n+=x.length;return A.size+':'+n};let _s=_sig(),_q=Date.now();while(Date.now()-_t<6e4){await new Promise(r=>setTimeout(r,200));const _n=_sig();if(_n!==_s){_s=_n;_q=Date.now();continue}if(Date.now()-_q>=2e3)break}}Z();"

/** Earlier shapes we still replace if a bun install restored them. */
const WAIT_CANDIDATES = [
  "await we(m.predictedRoots,m.maxProjects),Z();",
  "await we(m.predictedRoots,m.maxProjects);{const _t=Date.now();while(A.size<g&&Date.now()-_t<3e4){await new Promise(r=>setTimeout(r,200))}}Z();",
]

/** Find every tailwint dist/index.js that exists under node_modules. */
function findTargets() {
  const out = []
  const bunDir = join(ROOT, "node_modules", ".bun")
  let entries = []
  try {
    entries = readdirSync(bunDir)
  } catch {
    // .bun store not present (isolated linker not used / not installed)
  }
  for (const entry of entries) {
    if (!entry.startsWith("tailwint@")) continue
    const file = join(
      bunDir,
      entry,
      "node_modules",
      "tailwint",
      "dist",
      "index.js"
    )
    try {
      if (statSync(file).isFile()) out.push(file)
    } catch {
      // not extracted here
    }
  }
  // Hoisted layout fallback.
  const hoisted = join(ROOT, "node_modules", "tailwint", "dist", "index.js")
  try {
    if (statSync(hoisted).isFile()) out.push(hoisted)
  } catch {
    // not hoisted
  }
  return out
}

let patched = 0
let already = 0
for (const file of findTargets()) {
  const src = readFileSync(file, "utf-8")
  if (src.includes(WAIT_SETTLE)) {
    already++
    continue
  }
  const from = WAIT_CANDIDATES.find((candidate) => src.includes(candidate))
  if (!from) {
    // Unknown shape (tailwint updated upstream?) — skip rather than corrupt.
    console.warn(`[patch-tailwint] unrecognized shape, skipped: ${file}`)
    continue
  }
  writeFileSync(file, src.replace(from, WAIT_SETTLE))
  patched++
}

if (patched || already) {
  console.log(
    `[patch-tailwint] ${patched} patched, ${already} already patched (tailwint wait-for-settled-diagnostics fix).`
  )
} else {
  console.log("[patch-tailwint] tailwint not found, nothing to patch.")
}
