'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchBox({ big = false }: { big?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = q.trim()
    if (!value) return
    router.push(`/search?q=${encodeURIComponent(value)}${scope === 'all' ? '' : `&type=${scope}`}`)
  }

  return (
    <form onSubmit={submit} className="flex items-stretch gap-1" role="search">
      <label className="sr-only" htmlFor={big ? 'q-big' : 'q-top'}>
        Search GIFCHAIN
      </label>
      <select
        aria-label="Search scope"
        value={scope}
        onChange={(e) => setScope(e.target.value)}
        className="hidden sm:block"
      >
        <option value="all">all</option>
        <option value="block">block</option>
        <option value="tx">tx</option>
        <option value="object">object</option>
        <option value="collection">collection</option>
        <option value="wallet">wallet</option>
      </select>
      <input
        id={big ? 'q-big' : 'q-top'}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="block / tx / wallet / object / collection"
        className={big ? 'w-full' : 'w-[220px] md:w-[300px]'}
        style={big ? { fontSize: 13, padding: '5px 7px' } : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      <button type="submit" className="btn" style={big ? { fontSize: 12, padding: '0 14px' } : undefined}>
        search
      </button>
    </form>
  )
}
