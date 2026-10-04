// Comportamiento de cada CopyButton: copia, confirma durante dos segundos y,
// si no hay API de portapapeles, selecciona el texto.
export function bindCopyButtons(root: ParentNode = document): void {
  for (const button of root.querySelectorAll<HTMLButtonElement>(
    "[data-copy-button]:not([data-bound])"
  )) {
    button.toggleAttribute("data-bound", true)
    let timer: ReturnType<typeof setTimeout> | undefined
    const code = () =>
      button.closest("[data-copy-scope]")?.querySelector("code") ?? null

    button.addEventListener("click", async () => {
      const text = button.dataset.copy ?? code()?.innerText.trimEnd() ?? ""
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        // Portapapeles bloqueado (contexto inseguro, permisos): se selecciona
        // el texto para copiarlo a mano.
        const target = code()
        if (target) getSelection()?.selectAllChildren(target)
        return
      }
      const label = button.querySelector<HTMLElement>("[data-label]")
      const idle = button.querySelector("[data-icon=idle]")
      const done = button.querySelector("[data-icon=done]")
      const set = (copied: boolean) => {
        if (label)
          label.textContent =
            (copied ? label.dataset.done : label.dataset.idle) ?? ""
        idle?.classList.toggle("hidden", copied)
        done?.classList.toggle("hidden", !copied)
      }
      set(true)
      clearTimeout(timer)
      timer = setTimeout(() => set(false), 2000)
    })
  }
}
