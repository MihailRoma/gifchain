'use client'

import { useState } from 'react'

const BACKDROPS: Record<string, string> = {
  light: '#ffffff',
  dark: '#14150f',
  lime: '#d2fd00',
}

export function ObjectViewer({
  sheet,
  cell,
  filter,
  name,
}: {
  sheet: string
  cell: number
  filter: string | null
  name: string
}) {
  const [zoom, setZoom] = useState(288)
  const [backdrop, setBackdrop] = useState<keyof typeof BACKDROPS>('light')
  const [grid, setGrid] = useState(false)

  const col = cell % 4
  const row = Math.floor(cell / 4)

  return (
    <div>
      <div
        className="flex items-center justify-center border-b border-line p-3"
        style={{ background: BACKDROPS[backdrop] }}
      >
        <div className="relative" style={{ width: zoom, height: zoom }}>
          <span
            role="img"
            aria-label={name}
            className="block h-full w-full [image-rendering:pixelated]"
            style={{
              backgroundImage: `url(${sheet})`,
              backgroundSize: '400% 400%',
              backgroundPosition: `${(col / 3) * 100}% ${(row / 3) * 100}%`,
              filter: filter ?? undefined,
            }}
          />
          {grid ? (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(0deg, rgba(0,0,0,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.25) 1px, transparent 1px)',
                backgroundSize: `${zoom / 16}px ${zoom / 16}px`,
              }}
            />
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1 bg-surface-2 px-2 py-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
          zoom
        </span>
        {[144, 288, 448].map((z, i) => (
          <button
            key={z}
            type="button"
            className="btn"
            data-on={zoom === z ? 'true' : undefined}
            onClick={() => setZoom(z)}
          >
            {i + 1}x
          </button>
        ))}
        <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
          backdrop
        </span>
        {(Object.keys(BACKDROPS) as Array<keyof typeof BACKDROPS>).map((b) => (
          <button
            key={b}
            type="button"
            className="btn"
            data-on={backdrop === b ? 'true' : undefined}
            onClick={() => setBackdrop(b)}
          >
            {b}
          </button>
        ))}
        <button
          type="button"
          className="btn ml-2"
          data-on={grid ? 'true' : undefined}
          onClick={() => setGrid((g) => !g)}
        >
          pixel grid
        </button>
      </div>
    </div>
  )
}
