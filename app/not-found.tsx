import Link from 'next/link'
import { Panel, PanelNote } from '@/components/kit'

export default function NotFound() {
  return (
    <Panel tone="lime" title={'404 \u00b7 not in the index'}>
      <div className="p-3">
        <h1 className="font-mono text-[13px]">No leaf at that address</h1>
        <p className="mt-2 max-w-[62ch] font-mono text-[11px] leading-relaxed text-muted-foreground">
          The explorer could not resolve this path to a block, transaction, object, collection or
          wallet. Identifiers outside the archive window resolve only by exact lookup, and burned
          objects keep their history but lose their page.
        </p>
        <nav className="mt-3 flex flex-wrap gap-1">
          {[
            ['/', 'home'],
            ['/explorer', 'explorer'],
            ['/objects', 'objects'],
            ['/collections', 'collections'],
            ['/search', 'search'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="btn no-underline">
              {label}
            </Link>
          ))}
        </nav>
      </div>
      <PanelNote>error 404 {'\u00b7'} indexer node 04 {'\u00b7'} no state was harmed</PanelNote>
    </Panel>
  )
}
