// Dependency-free so client components can render sprites without pulling the
// generated chain dataset (lib/chain/data) into the browser bundle.
export function Sprite({
  sheet,
  cell,
  filter,
  size = 32,
  fluid = false,
  className = '',
  title,
}: {
  sheet: string
  cell: number
  filter?: string | null
  size?: number
  /** Fill the parent's width and stay square, instead of using a fixed pixel size. */
  fluid?: boolean
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
      className={`sprite ${fluid ? 'block aspect-square w-full' : ''} ${className}`}
      style={{
        width: fluid ? undefined : size,
        height: fluid ? undefined : size,
        backgroundImage: `url(${sheet})`,
        backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
        filter: filter ?? undefined,
      }}
    />
  )
}
