import { Skeleton } from "@/components/ui/skeleton"

// Alturas fijas de las columnas de la gráfica de carga (en %), para que no
// cambien entre renders
const CHART_COLUMNS = [
  30, 55, 20, 0, 45, 70, 35, 10, 60, 25, 0, 40, 80, 50, 15, 35, 65, 20, 0, 45,
  30, 55, 75, 25, 10, 50, 40, 60, 20, 35,
]

/** Cabecera de bloque: número, título y, a la derecha, nota y enlace. */
export function HeaderSkeleton() {
  return (
    <div className="border-rule flex items-center gap-5 rule-b pb-3">
      <Skeleton className="h-3 w-5" />
      <Skeleton className="h-5 w-32" />
      <Skeleton className="ml-auto h-3 w-40" />
    </div>
  )
}

/** Barra apilada con su leyenda. */
function BarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3 w-full" />
      <div className="flex gap-5">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-3 w-24" />
        ))}
      </div>
    </div>
  )
}

/** Franja de cifras: etiqueta y número en cada celda. */
export function StripSkeleton({ cells }: { cells: number }) {
  return (
    <div className="border-rule flex flex-wrap gap-y-4 rule-l">
      {Array.from({ length: cells }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 border-r px-5 last:border-r-0"
        >
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  )
}

/** Dos listas cortas, lado a lado desde `sm`. */
function ListsSkeleton() {
  return (
    <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
      {[0, 1].map((list) => (
        <div key={list} className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-28" />
          <div className="divide-y border-y">
            {[0, 1, 2, 3, 4].map((row) => (
              <div
                key={row}
                className="flex min-h-10 items-center justify-between gap-3 py-2"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Gráfica de columnas por día. */
function ChartSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex h-32 items-end gap-0.5 border-y">
        {CHART_COLUMNS.map((height, i) => (
          <div key={i} className="flex h-full flex-1 items-end justify-center">
            {height > 0 ? (
              <Skeleton
                className="w-full max-w-6 rounded-t-sm rounded-b-none"
                style={{ height: `${height}%` }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Las tres filas de contenido de los bloques de stacks y seguridad (barra,
 * cifras y listas) como hijos sueltos, para que encajen en su subgrid.
 */
export function BlockRowsSkeleton({ cells }: { cells: number }) {
  return (
    <>
      <BarSkeleton />
      <StripSkeleton cells={cells} />
      <ListsSkeleton />
    </>
  )
}

/** Contenido del bloque de despliegues: cifras, gráfica y listas. */
export function ActivitySkeleton() {
  return (
    <>
      <StripSkeleton cells={5} />
      <ChartSkeleton />
      <ListsSkeleton />
    </>
  )
}
