'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Glyph } from '@/components/glyph'
import { CHAIN, heightAtTime } from '@/lib/chain/constants'
import { hexFrom } from '@/lib/chain/rng'
import { useNow } from '@/components/live/now-provider'

type Tier = 'opus' | 'sonnet' | 'haiku'

export interface SpawnSwarmOption {
  slug: string
  name: string
  symbol: string
  roles: string[]
  feeBps: number
  tools: string[]
}

const TIER_COST: Record<Tier, number> = { opus: 48, sonnet: 12, haiku: 3 }
const TIER_NOTE: Record<Tier, string> = {
  opus: 'deepest reasoning, slowest, 1M context available',
  sonnet: 'the default: fast enough for most mandates, 200k-500k context',
  haiku: 'cheapest per inference, 200k context, brief reasoning only',
}
const MEMORY = ['Persistent', 'Rolling 30d', 'Rolling 7d', 'Ephemeral']

/**
 * Spawn form. Everything is computed locally: the address the agent would
 * receive is a hash of the operator, swarm and nonce, so the glyph preview is
 * the real glyph the agent would carry if this were broadcast.
 */
export function SpawnPanel({ swarms }: { swarms: SpawnSwarmOption[] }) {
  const now = useNow()
  const head = heightAtTime(now)
  const [swarm, setSwarm] = useState(swarms[0].slug)
  const [tier, setTier] = useState<Tier>('sonnet')
  const [role, setRole] = useState(swarms[0].roles[0])
  const [memory, setMemory] = useState(MEMORY[0])
  const [temperature, setTemperature] = useState(0.4)
  const [mandate, setMandate] = useState('')
  const [operator, setOperator] = useState('')
  const [submitted, setSubmitted] = useState<null | { hash: string; height: number; address: string }>(null)

  const current = swarms.find((s) => s.slug === swarm) ?? swarms[0]
  const validOperator = /^0x[0-9a-fA-F]{40}$/.test(operator)
  const address = useMemo(
    () => '0x' + hexFrom(`spawn-preview:${operator.toLowerCase()}:${swarm}:${tier}:${role}`, 40),
    [operator, swarm, tier, role],
  )
  const fee = (TIER_COST[tier] * (1 + current.feeBps / 10_000)).toFixed(2)

  function choose(slug: string) {
    setSwarm(slug)
    const next = swarms.find((s) => s.slug === slug)
    if (next) setRole(next.roles[0])
    setSubmitted(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validOperator) return
    setSubmitted({
      hash: '0x' + hexFrom(`spawn-tx:${address}:${head}`, 64),
      height: head + 1,
      address,
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-0 md:grid-cols-[1fr_300px]">
      <div className="border-b border-hair md:border-b-0 md:border-r">
        <fieldset className="border-b border-hair p-2">
          <legend className="sr-only">Swarm</legend>
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">1. choose a swarm</div>
          <div className="flex flex-wrap gap-1">
            {swarms.map((s) => (
              <button
                key={s.slug}
                type="button"
                className="btn"
                data-on={s.slug === swarm ? 'true' : undefined}
                onClick={() => choose(s.slug)}
              >
                {s.symbol}
              </button>
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">
            {current.name} {'\u00b7'} operator fee {(current.feeBps / 100).toFixed(2)}% {'\u00b7'} tools:{' '}
            {current.tools.join(', ')}
          </p>
        </fieldset>

        <fieldset className="border-b border-hair p-2">
          <legend className="sr-only">Tier</legend>
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">2. model tier</div>
          <div className="flex flex-wrap gap-1">
            {(['opus', 'sonnet', 'haiku'] as Tier[]).map((t) => (
              <button key={t} type="button" className="btn" data-on={t === tier ? 'true' : undefined} onClick={() => { setTier(t); setSubmitted(null) }}>
                {t} {'\u00b7'} {TIER_COST[t]} {CHAIN.ticker}
              </button>
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-muted-foreground">{TIER_NOTE[tier]}</p>
        </fieldset>

        <div className="grid gap-2 border-b border-hair p-2 sm:grid-cols-3">
          <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            3. role
            <select value={role} onChange={(e) => setRole(e.target.value)} className="normal-case tracking-normal">
              {current.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            memory policy
            <select value={memory} onChange={(e) => setMemory(e.target.value)} className="normal-case tracking-normal">
              {MEMORY.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            temperature {'\u00b7'} {temperature.toFixed(2)}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="accent-[var(--clay)]"
            />
          </label>
        </div>

        <div className="grid gap-2 p-2 sm:grid-cols-[1fr_1fr]">
          <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            4. operator address (receives the agent)
            <input
              value={operator}
              onChange={(e) => { setOperator(e.target.value.trim()); setSubmitted(null) }}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
              className="normal-case tracking-normal"
              aria-invalid={operator.length > 0 && !validOperator}
            />
          </label>
          <label className="flex flex-col gap-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
            additional instructions (appended to the swarm mandate)
            <textarea
              value={mandate}
              onChange={(e) => setMandate(e.target.value)}
              rows={2}
              placeholder="optional. committed to the agent's first memory write."
              className="normal-case tracking-normal"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="panel-hd panel-hd--plain">preview</div>
        <div className="flex flex-col items-center gap-2 p-3">
          <Glyph seed={address} tier={tier} size={140} title="agent glyph preview" />
          <div className="w-full font-mono text-[10px]">
            <div className="flex justify-between border-b border-hair py-[2px]">
              <span className="text-muted-foreground">would be named</span>
              <span>{current.symbol}-????</span>
            </div>
            <div className="flex justify-between border-b border-hair py-[2px]">
              <span className="text-muted-foreground">address</span>
              <span title={address}>{address.slice(0, 10)}{'\u2026'}{address.slice(-6)}</span>
            </div>
            <div className="flex justify-between border-b border-hair py-[2px]">
              <span className="text-muted-foreground">spawn fee</span>
              <span className="num">{fee} {CHAIN.ticker}</span>
            </div>
            <div className="flex justify-between border-b border-hair py-[2px]">
              <span className="text-muted-foreground">memory</span>
              <span>{memory}</span>
            </div>
            <div className="flex justify-between border-b border-hair py-[2px]">
              <span className="text-muted-foreground">would seal in</span>
              <span className="num" suppressHydrationWarning>
                block {head + 1}
              </span>
            </div>
          </div>
          <button type="submit" className="btn w-full justify-center py-1 text-[11px]" disabled={!validOperator}>
            spawn agent
          </button>
          {!validOperator && operator.length > 0 ? (
            <p className="font-mono text-[10px] text-destructive">operator must be a 20-byte hex address</p>
          ) : null}
          {submitted ? (
            <div className="w-full border border-clay bg-ink p-2 font-mono text-[10px] leading-relaxed">
              <div className="text-clay">simulated broadcast</div>
              <div className="mt-1 break-all">tx {submitted.hash}</div>
              <div className="break-all">agent {submitted.address}</div>
              <div>
                target block{' '}
                <Link href={`/block/${submitted.height}`}>{submitted.height}</Link>
              </div>
              <p className="mt-1 text-muted-foreground">
                nothing left this page. this network is a simulation; see the{' '}
                <Link href="/docs/spawning">spawning guide</Link> for what the real call looks like.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </form>
  )
}
