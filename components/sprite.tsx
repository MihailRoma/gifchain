// Dependency-free so client components can render sprites without pulling the
// generated chain dataset (lib/chain/data) into the browser bundle.
export function Sprite({
  sheet,
  cell,
  filter,
  size = 32,
  className = '',
  title,
}: {
  sheet: string
  cell: number
  filter?: string | null
  size?: number
  className?: string
  title?: string
}) {
  const col = cell % 4
  const row = Math.floor(cell / 4)
  return (
    <span
      role="img"
      aria-label={title ?? 'object preview'}
      title={title}
      className={`sprite ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
        filter: filter ?? undefined,
      }}
    />
  )
}
