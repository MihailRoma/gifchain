import { BURN_ADDRESS, CHAIN, blockTimeAt, heightAtTime, heightToTs } from './constants'
import { liveBlockAt, type LiveBlock, type SpriteRef } from './live'
import { hexFrom, int, pick, rngFor } from './rng'

/**
 * Height the object index was built up to. The chain keeps sealing blocks after
 * this point; those are produced on demand by `lib/chain/live`. Pinning the
 * index to process start (rather than a hard-coded constant) keeps indexed
 * history sitting just behind the tip instead of receding further every day.
 */
export const INDEX_HEAD = heightAtTime(Date.now())

/** Current head. Recomputed per call — the chain does not wait for us. */
export function liveHead(): number {
  return heightAtTime(Date.now())
}

/** Mean seal gap over the last `window` blocks, in seconds. */
export function measuredBlockTime(window = 1000): number {
  const head = liveHead()
  const span = blockTimeAt(head) - blockTimeAt(head - window)
  return Math.round((span / window / 1000) * 100) / 100
}

/* ------------------------------------------------------------------ types */

export type EventType = 'MINT' | 'SALE' | 'TRANSFER' | 'BURN' | 'LIST' | 'BID' | 'DEPLOY'

export interface Wallet {
  address: string
  handle: string | null
  label: string | null
  kind: 'account' | 'contract' | 'system' | 'sequencer'
  firstSeen: number
}

export interface Collection {
  slug: string
  name: string
  symbol: string
  contract: string
  standard: 'GIF-721' | 'GIF-1155'
  sheet: string
  filter: string | null
  creator: string
  description: string
  supply: number
  deployHeight: number
  royaltyBps: number
  category: string
  verified: boolean
  media: 'GIF' | 'PNG' | 'GIF / PNG'
}

export interface Trait {
  trait: string
  value: string
  share: number
}

export interface GifObject {
  key: string
  slug: string
  tokenId: number
  name: string
  cell: number
  variant: number
  filter: string | null
  traits: Trait[]
  rarityScore: number
  rarityRank: number
  owner: string
  minter: string
  mintHeight: number
  mintTs: number
  mintHash: string
  lastPrice: number | null
  listPrice: number | null
  burned: boolean
  bytes: number
  frames: number
  dims: string
}

export interface ChainEvent {
  hash: string
  type: EventType
  height: number
  ts: number
  index: number
  objectKey: string | null
  slug: string | null
  from: string
  to: string
  price: number | null
  fee: number
  gasUsed: number
  nonce: number
  status: 'success' | 'failed'
}

export interface Block {
  height: number
  hash: string
  parentHash: string
  stateRoot: string
  objectRoot: string
  ts: number
  sequencer: string
  txCount: number
  mints: number
  transfers: number
  burns: number
  sales: number
  collections: string[]
  gasUsed: number
  gasLimit: number
  baseFee: number
  fees: number
  size: number
  events: ChainEvent[]
}

/* -------------------------------------------------------------- sequencers */

// Defined in ./constants so client bundles can name a proposer without pulling
// this module in.
export { SEQUENCERS } from './constants'
import { SEQUENCERS } from './constants'

/* ----------------------------------------------------------------- wallets */

const HANDLES = [
  'pixelfiend.gif',
  'vaultkeeper.gif',
  'object.museum.gif',
  'lowbit.gif',
  'crt.gif',
  'gifgoblin.gif',
  'palette.gif',
  'frame12.gif',
  'nyan.gif',
  'dither.gif',
  'sprite.dealer.gif',
  'coldstorage.gif',
  'bigwhale.gif',
  'tinyjpeg.gif',
  'archive.gif',
  'midnight.gif',
]

const SYSTEM_WALLETS: Array<Omit<Wallet, 'firstSeen'>> = [
  {
    address: '0x0000000000000000000000000000000000000000',
    handle: null,
    label: 'Null / burn address',
    kind: 'system',
  },
  {
    address: '0x00000000000000000000000000000000000000f1',
    handle: null,
    label: 'GIFCHAIN: Object Mint Module',
    kind: 'system',
  },
  {
    address: '0x00000000000000000000000000000000000000a7',
    handle: null,
    label: 'GIFCHAIN: Market Escrow',
    kind: 'contract',
  },
  {
    address: '0x00000000000000000000000000000000000000b2',
    handle: null,
    label: 'GIFCHAIN: Bridge Vault',
    kind: 'contract',
  },
  {
    address: '0x00000000000000000000000000000000000000c3',
    handle: null,
    label: 'GIFCHAIN: Royalty Splitter',
    kind: 'contract',
  },
]

export const MARKET_ESCROW = SYSTEM_WALLETS[2].address
export const MINT_MODULE = SYSTEM_WALLETS[1].address

function buildWallets(): Wallet[] {
  const out: Wallet[] = SYSTEM_WALLETS.map((w, i) => ({
    ...w,
    firstSeen: INDEX_HEAD - 3_900_000 - i,
  }))
  for (let i = 0; i < 46; i++) {
    const r = rngFor(`wallet:${i}`)
    out.push({
      address: '0x' + hexFrom(`wallet-addr:${i}`, 40),
      handle: i < HANDLES.length ? HANDLES[i] : null,
      label: null,
      kind: 'account',
      firstSeen: INDEX_HEAD - int(r, 12_000, 2_400_000),
    })
  }
  return out
}

export const wallets = buildWallets()
const accountWallets = wallets.filter((w) => w.kind === 'account')
const walletByAddress = new Map(wallets.map((w) => [w.address.toLowerCase(), w]))

export function getWallet(address: string): Wallet | null {
  const found = walletByAddress.get(address.toLowerCase())
  if (found) return found
  if (/^0x[0-9a-f]{40}$/i.test(address)) {
    return {
      address: address.toLowerCase(),
      handle: null,
      label: null,
      kind: 'account',
      firstSeen: INDEX_HEAD - 1,
    }
  }
  return null
}

export function walletName(address: string): string {
  const w = walletByAddress.get(address.toLowerCase())
  return w?.handle ?? w?.label ?? address
}

/* ------------------------------------------------------------- collections */

interface CollectionSeed {
  slug: string
  name: string
  symbol: string
  sheet: string
  filter: string | null
  supply: number
  deployAgo: number
  royaltyBps: number
  category: string
  standard: 'GIF-721' | 'GIF-1155'
  media: 'GIF' | 'PNG' | 'GIF / PNG'
  description: string
  bodies: string[]
}

const COLLECTION_SEEDS: CollectionSeed[] = [
  {
    slug: 'gifcats',
    name: 'GIFCATS',
    symbol: 'GCAT',
    sheet: '/objects/gifcats.png',
    filter: null,
    supply: 48,
    deployAgo: 3_480_000,
    royaltyBps: 250,
    category: 'PFP',
    standard: 'GIF-721',
    media: 'GIF',
    description:
      'The first object collection deployed on GIFCHAIN. 48 cats, four frames each, written straight onto the object layer at mint. Nothing is hosted anywhere.',
    bodies: ['Tabby', 'Void', 'Snow', 'Calico', 'Siamese', 'Sphynx'],
  },
  {
    slug: 'blockapes',
    name: 'BLOCKAPES',
    symbol: 'BAPE',
    sheet: '/objects/blockapes.png',
    filter: null,
    supply: 48,
    deployAgo: 3_140_000,
    royaltyBps: 500,
    category: 'PFP',
    standard: 'GIF-721',
    media: 'PNG',
    description:
      'Heavy, square, unbothered. BLOCKAPES was the first collection to use the on-chain gear registry, so every accessory is its own sprite with its own palette.',
    bodies: ['Brown', 'Ash', 'Olive', 'Bone', 'Ink', 'Rust'],
  },
  {
    slug: 'spectral',
    name: 'SPECTRAL OBJECTS',
    symbol: 'SPEC',
    sheet: '/objects/ghosts.png',
    filter: null,
    supply: 48,
    deployAgo: 2_260_000,
    royaltyBps: 300,
    category: 'ART',
    standard: 'GIF-721',
    media: 'GIF',
    description:
      'Ghosts, skulls and visitors. SPECTRAL was minted during the first burn event and roughly one in twelve objects has been sent to the null address since.',
    bodies: ['Ghost', 'Skull', 'Visitor', 'Wisp', 'Shade'],
  },
  {
    slug: 'terminals',
    name: 'TERMINALS',
    symbol: 'TERM',
    sheet: '/objects/crtheads.png',
    filter: null,
    supply: 48,
    deployAgo: 1_690_000,
    royaltyBps: 250,
    category: 'HARDWARE',
    standard: 'GIF-1155',
    media: 'GIF / PNG',
    description:
      'Dead hardware, kept alive as objects: CRTs, floppies, tape, towers, modems. TERMINALS is the reference implementation of the GIF-1155 multi-edition standard.',
    bodies: ['CRT', 'Floppy', 'Tape', 'Tower', 'Modem', 'Printer'],
  },
  {
    slug: 'netpets',
    name: 'NETPETS',
    symbol: 'NPET',
    sheet: '/objects/netpets.png',
    filter: null,
    supply: 48,
    deployAgo: 980_000,
    royaltyBps: 400,
    category: 'PFP',
    standard: 'GIF-721',
    media: 'GIF',
    description:
      'Animals of the early internet. NETPETS is the most traded collection on the network and the usual first object in a new wallet.',
    bodies: ['Shiba', 'Penguin', 'Frog', 'Bear', 'Whale', 'Fox'],
  },
  {
    slug: 'citizens',
    name: 'CITIZENS OF GIFCHAIN',
    symbol: 'CTZN',
    sheet: '/objects/citizens.png',
    filter: null,
    supply: 48,
    deployAgo: 1_460_000,
    royaltyBps: 350,
    category: 'PFP',
    standard: 'GIF-721',
    media: 'PNG',
    description:
      'Everyone who keeps the chain running, drawn as objects. Punks, astronauts, chefs, wizards and surgeons — no two share a profession, and the trait roll picks a job before it picks a face.',
    bodies: ['Punk', 'Astronaut', 'Diver', 'Cyber', 'Wizard', 'Viking'],
  },
  {
    slug: 'motorcade',
    name: 'MOTORCADE',
    symbol: 'MCAD',
    sheet: '/objects/machines.png',
    filter: null,
    supply: 48,
    deployAgo: 720_000,
    royaltyBps: 300,
    category: 'MACHINE',
    standard: 'GIF-721',
    media: 'PNG',
    description:
      'Anything that moves: sports cars, hovercars, saucers, submarines, mechs and one very slow bulldozer. MOTORCADE stress-tested the object layer with the widest silhouette range on the chain.',
    bodies: ['Sportscar', 'Hovercar', 'Saucer', 'Submarine', 'Mech', 'Rocket'],
  },
  {
    slug: 'malformed',
    name: 'MALFORMED',
    symbol: 'NULL',
    sheet: '/objects/corrupted.png',
    filter: null,
    supply: 48,
    deployAgo: 84_000,
    royaltyBps: 0,
    category: 'GLITCH',
    standard: 'GIF-721',
    media: 'PNG',
    description:
      'Objects that failed to render and were minted anyway. Missing textures, blue screens, 404s and datamosh — MALFORMED collects the errors the object layer threw during a bad sequencer week. Zero royalties, on purpose.',
    bodies: ['404', 'Missing', 'BSOD', 'Datamosh', 'Static', 'Redacted'],
  },
  {
    slug: 'gifcats-noir',
    name: 'GIFCATS: NOIR',
    symbol: 'GCATN',
    sheet: '/objects/gifcats.png',
    filter: 'grayscale(1) contrast(1.25)',
    supply: 24,
    deployAgo: 640_000,
    royaltyBps: 250,
    category: 'DERIVATIVE',
    standard: 'GIF-721',
    media: 'GIF',
    description:
      'A licensed palette fork of GIFCATS. The contract reads the parent object at render time and applies a single-channel palette, so NOIR cannot exist without its parent.',
    bodies: ['Tabby', 'Void', 'Snow', 'Calico'],
  },
  {
    slug: 'deepfried',
    name: 'DEEPFRIED APES',
    symbol: 'FRIED',
    sheet: '/objects/blockapes.png',
    filter: 'saturate(2.4) contrast(1.5) hue-rotate(-18deg)',
    supply: 24,
    deployAgo: 410_000,
    royaltyBps: 690,
    category: 'DERIVATIVE',
    standard: 'GIF-721',
    media: 'PNG',
    description:
      'Unlicensed, extremely compressed, wildly popular. The contract re-encodes the parent object at a quality setting the parent team described publicly as "hostile".',
    bodies: ['Brown', 'Ash', 'Olive', 'Bone'],
  },
  {
    slug: 'burn-in',
    name: 'TERMINAL BURN-IN',
    symbol: 'BURN',
    sheet: '/objects/crtheads.png',
    filter: 'sepia(0.85) contrast(1.15) brightness(0.95)',
    supply: 24,
    deployAgo: 180_000,
    royaltyBps: 250,
    category: 'DERIVATIVE',
    standard: 'GIF-1155',
    media: 'GIF',
    description:
      'What is left after a TERMINAL object stays on screen for too long. Minted automatically by the phosphor module whenever a TERMINAL is held for 100,000 blocks.',
    bodies: ['CRT', 'Floppy', 'Tape', 'Tower'],
  },
]

const VARIANT_NAMES = ['Original', 'Shifted', 'Monochrome']
const VARIANT_FILTERS: Array<string | null> = [
  null,
  'hue-rotate(155deg)',
  'saturate(0.12) contrast(1.2)',
]

const BACKGROUNDS = ['Flat Mint', 'Flat Peach', 'Flat Sky', 'Lilac', 'Sand', 'Void Black', 'Signal Lime']
const GEAR = ['None', 'Cap', 'Crown', 'Headphones', 'Shades', 'Bandana', 'Halo', '3D Glasses', 'Eyepatch']
const EYES = ['Open', 'Half', 'Wide', 'Laser', 'Closed', 'Glitched']
const MOTION = ['Static', '4 frames', '8 frames', '12 frames']

export const collections: Collection[] = COLLECTION_SEEDS.map((seed) => ({
  slug: seed.slug,
  name: seed.name,
  symbol: seed.symbol,
  contract: '0x' + hexFrom(`contract:${seed.slug}`, 40),
  standard: seed.standard,
  sheet: seed.sheet,
  filter: seed.filter,
  creator: accountWallets[seedIndex(seed.slug, accountWallets.length)].address,
  description: seed.description,
  supply: seed.supply,
  deployHeight: INDEX_HEAD - seed.deployAgo,
  royaltyBps: seed.royaltyBps,
  category: seed.category,
  verified: seed.category !== 'DERIVATIVE' || seed.slug === 'gifcats-noir',
  media: seed.media,
}))

function seedIndex(key: string, mod: number): number {
  return Math.floor(rngFor(`idx:${key}`)() * mod)
}

const collectionBySlug = new Map(collections.map((c) => [c.slug, c]))
const collectionByContract = new Map(collections.map((c) => [c.contract.toLowerCase(), c]))

export function getCollection(slug: string): Collection | null {
  return collectionBySlug.get(slug) ?? null
}
export function getCollectionByContract(addr: string): Collection | null {
  return collectionByContract.get(addr.toLowerCase()) ?? null
}

/* ----------------------------------------------------------------- objects */

function buildObjects(): GifObject[] {
  const out: GifObject[] = []
  for (const seed of COLLECTION_SEEDS) {
    const col = collectionBySlug.get(seed.slug)!
    const scored: Array<{ obj: GifObject; score: number }> = []
    for (let i = 0; i < seed.supply; i++) {
      const tokenId = i + 1
      const key = `${seed.slug}/${tokenId}`
      const r = rngFor(`object:${key}`)
      const cell = i % 16
      const variant = Math.floor(i / 16) % 3
      const bg = BACKGROUNDS[cell % BACKGROUNDS.length]
      const body = seed.bodies[cell % seed.bodies.length]
      const gear = pick(r, GEAR)
      const eyes = pick(r, EYES)
      const motion = seed.media === 'PNG' ? 'Static' : pick(r, MOTION)
      const traits: Trait[] = [
        { trait: 'Background', value: bg, share: 6 + Math.round(r() * 18) },
        { trait: 'Body', value: body, share: 8 + Math.round(r() * 20) },
        { trait: 'Gear', value: gear, share: 2 + Math.round(r() * 24) },
        { trait: 'Eyes', value: eyes, share: 4 + Math.round(r() * 22) },
        { trait: 'Palette', value: VARIANT_NAMES[variant], share: variant === 0 ? 46 : 27 },
        { trait: 'Motion', value: motion, share: motion === 'Static' ? 38 : 12 + Math.round(r() * 16) },
      ]
      const score = traits.reduce((acc, t) => acc + 100 / t.share, 0)
      const filterParts = [col.filter, VARIANT_FILTERS[variant]].filter(Boolean) as string[]
      const inWindow = r() < 0.16
      const mintHeight = inWindow
        ? INDEX_HEAD - int(r, 2, CHAIN.indexWindow - 4)
        : Math.min(
            INDEX_HEAD - CHAIN.indexWindow - 10,
            col.deployHeight + int(r, 3, 90_000),
          )
      const obj: GifObject = {
        key,
        slug: seed.slug,
        tokenId,
        name: `${seed.name} #${String(tokenId).padStart(4, '0')}`,
        cell,
        variant,
        filter: filterParts.length ? filterParts.join(' ') : null,
        traits,
        rarityScore: Math.round(score * 10) / 10,
        rarityRank: 0,
        owner: BURN_ADDRESS,
        minter: BURN_ADDRESS,
        mintHeight,
        mintTs: heightToTs(mintHeight),
        mintHash: '0x' + hexFrom(`mint:${key}`, 64),
        lastPrice: null,
        listPrice: null,
        burned: false,
        bytes: 96 + Math.round(r() * 3400),
        frames: motion === 'Static' ? 1 : parseInt(motion, 10) || 1,
        dims: pick(r, ['16 x 16', '24 x 24', '32 x 32']),
      }
      scored.push({ obj, score })
      out.push(obj)
    }
    scored
      .sort((a, b) => b.score - a.score)
      .forEach((entry, i) => {
        entry.obj.rarityRank = i + 1
      })
  }
  return out
}

export const objects = buildObjects()
const objectByKey = new Map(objects.map((o) => [o.key, o]))

export function getObject(slug: string, tokenId: number): GifObject | null {
  return objectByKey.get(`${slug}/${tokenId}`) ?? null
}
export function getObjectByKey(key: string): GifObject | null {
  return objectByKey.get(key) ?? null
}

/* ------------------------------------------------------------------ events */

function floorFor(slug: string): number {
  const r = rngFor(`floor:${slug}`)
  return Math.round((0.4 + r() * 24) * 100) / 100
}

const events: ChainEvent[] = []
const mintsByHeight = new Map<number, GifObject[]>()

for (const obj of objects) {
  const list = mintsByHeight.get(obj.mintHeight) ?? []
  list.push(obj)
  mintsByHeight.set(obj.mintHeight, list)
}

const windowStart = INDEX_HEAD - CHAIN.indexWindow + 1
const activeHeights = new Set<number>([...mintsByHeight.keys()])
for (let h = windowStart; h <= INDEX_HEAD; h++) activeHeights.add(h)
for (const col of collections) activeHeights.add(col.deployHeight)

const deploysByHeight = new Map<number, Collection[]>()
for (const col of collections) {
  const list = deploysByHeight.get(col.deployHeight) ?? []
  list.push(col)
  deploysByHeight.set(col.deployHeight, list)
}

const alive: GifObject[] = []
const nonceByWallet = new Map<string, number>()

function nextNonce(addr: string): number {
  const n = (nonceByWallet.get(addr) ?? 0) + 1
  nonceByWallet.set(addr, n)
  return n
}

function pushEvent(e: Omit<ChainEvent, 'hash' | 'ts' | 'nonce'>): ChainEvent {
  const hash = '0x' + hexFrom(`tx:${e.height}:${e.index}:${e.objectKey ?? e.type}`, 64)
  const full: ChainEvent = {
    ...e,
    hash,
    ts: heightToTs(e.height),
    nonce: nextNonce(e.from),
  }
  events.push(full)
  return full
}

const sortedHeights = [...activeHeights].sort((a, b) => a - b)

for (const height of sortedHeights) {
  let index = 0
  const r = rngFor(`block-events:${height}`)

  for (const col of deploysByHeight.get(height) ?? []) {
    pushEvent({
      type: 'DEPLOY',
      height,
      index: index++,
      objectKey: null,
      slug: col.slug,
      from: col.creator,
      to: col.contract,
      price: null,
      fee: Math.round((0.18 + r() * 0.4) * 10000) / 10000,
      gasUsed: int(r, 1_100_000, 2_400_000),
      status: 'success',
    })
  }

  for (const obj of mintsByHeight.get(height) ?? []) {
    const minter = accountWallets[Math.floor(rngFor(`minter:${obj.key}`)() * accountWallets.length)]
    obj.owner = minter.address
    obj.minter = minter.address
    const ev = pushEvent({
      type: 'MINT',
      height,
      index: index++,
      objectKey: obj.key,
      slug: obj.slug,
      from: MINT_MODULE,
      to: minter.address,
      price: Math.round(floorFor(obj.slug) * 0.35 * 100) / 100,
      fee: Math.round((0.004 + r() * 0.03) * 10000) / 10000,
      gasUsed: int(r, 88_000, 190_000),
      status: 'success',
    })
    obj.mintHash = ev.hash
    alive.push(obj)
  }

  if (height >= windowStart && alive.length > 8) {
    const roll = r()
    const count = roll < 0.16 ? 0 : roll < 0.52 ? 1 : roll < 0.8 ? 2 : roll < 0.94 ? 3 : int(r, 4, 6)
    for (let k = 0; k < count; k++) {
      const obj = alive[Math.floor(r() * alive.length)]
      if (!obj || obj.burned) continue
      const owner = obj.owner
      const counterparty = accountWallets[Math.floor(r() * accountWallets.length)]
      if (counterparty.address === owner) continue
      const floor = floorFor(obj.slug)
      const price = Math.round(floor * (0.72 + r() * 2.6) * 100) / 100
      const typeRoll = r()
      let type: EventType = 'TRANSFER'
      if (typeRoll < 0.34) type = 'SALE'
      else if (typeRoll < 0.56) type = 'LIST'
      else if (typeRoll < 0.72) type = 'BID'
      else if (typeRoll < 0.96) type = 'TRANSFER'
      else type = 'BURN'

      const base = {
        height,
        index: index++,
        objectKey: obj.key,
        slug: obj.slug,
        gasUsed: int(r, 42_000, 132_000),
        fee: Math.round((0.002 + r() * 0.02) * 10000) / 10000,
        status: (r() < 0.985 ? 'success' : 'failed') as 'success' | 'failed',
      }

      if (type === 'SALE') {
        pushEvent({ ...base, type, from: owner, to: counterparty.address, price })
        if (base.status === 'success') {
          obj.owner = counterparty.address
          obj.lastPrice = price
          obj.listPrice = null
        }
      } else if (type === 'LIST') {
        pushEvent({ ...base, type, from: owner, to: MARKET_ESCROW, price })
        if (base.status === 'success') obj.listPrice = price
      } else if (type === 'BID') {
        pushEvent({
          ...base,
          type,
          from: counterparty.address,
          to: MARKET_ESCROW,
          price: Math.round(price * 0.82 * 100) / 100,
        })
      } else if (type === 'TRANSFER') {
        pushEvent({ ...base, type, from: owner, to: counterparty.address, price: null })
        if (base.status === 'success') obj.owner = counterparty.address
      } else {
        pushEvent({ ...base, type, from: owner, to: BURN_ADDRESS, price: null })
        if (base.status === 'success') {
          obj.owner = BURN_ADDRESS
          obj.burned = true
          obj.listPrice = null
          const i = alive.indexOf(obj)
          if (i >= 0) alive.splice(i, 1)
        }
      }
    }
  }
}

events.sort((a, b) => (a.height === b.height ? a.index - b.index : a.height - b.height))

/* ----------------------------------------------------------------- indexes */

const eventsByHeight = new Map<number, ChainEvent[]>()
const eventsByObject = new Map<string, ChainEvent[]>()
const eventsBySlug = new Map<string, ChainEvent[]>()
const eventsByWallet = new Map<string, ChainEvent[]>()
const eventByHash = new Map<string, ChainEvent>()

for (const e of events) {
  push(eventsByHeight, e.height, e)
  if (e.objectKey) push(eventsByObject, e.objectKey, e)
  if (e.slug) push(eventsBySlug, e.slug, e)
  push(eventsByWallet, e.from.toLowerCase(), e)
  if (e.to.toLowerCase() !== e.from.toLowerCase()) push(eventsByWallet, e.to.toLowerCase(), e)
  eventByHash.set(e.hash, e)
}

function push<K>(map: Map<K, ChainEvent[]>, key: K, e: ChainEvent) {
  const list = map.get(key)
  if (list) list.push(e)
  else map.set(key, [e])
}

const eventsDesc = [...events].reverse()

/** How far above the index the tip feed is generated. Bounds per-request work. */
const TIP_FEED_BLOCKS = 800

/** Tip events, newest first, generated on demand from heights above the index. */
export function tipEvents(limit: number, offset = 0, types?: EventType[]): ChainEvent[] {
  const head = liveHead()
  const floor = Math.max(INDEX_HEAD, head - TIP_FEED_BLOCKS)
  const out: ChainEvent[] = []
  let skipped = 0
  for (let h = head; h > floor && out.length < limit; h--) {
    const block = liveToBlock(liveBlockAt(h, spritePool()))
    for (let i = block.events.length - 1; i >= 0 && out.length < limit; i--) {
      const e = block.events[i]
      if (types && !types.includes(e.type)) continue
      if (skipped < offset) {
        skipped++
        continue
      }
      out.push(e)
    }
  }
  return out
}

export function getEvent(hash: string): ChainEvent | null {
  const indexed = eventByHash.get(hash.toLowerCase()) ?? null
  if (indexed) return indexed
  // Tip transactions are generated, not stored, so recover by scanning back
  // from the head over the same window the feed exposes.
  const target = hash.toLowerCase()
  const head = liveHead()
  const floor = Math.max(INDEX_HEAD, head - TIP_FEED_BLOCKS)
  for (let h = head; h > floor; h--) {
    for (const e of liveToBlock(liveBlockAt(h, spritePool())).events) {
      if (e.hash === target) return e
    }
  }
  return null
}
export function objectHistory(key: string): ChainEvent[] {
  return [...(eventsByObject.get(key) ?? [])].reverse()
}
export function collectionActivity(slug: string): ChainEvent[] {
  return [...(eventsBySlug.get(slug) ?? [])].reverse()
}
export function walletActivity(address: string): ChainEvent[] {
  return [...(eventsByWallet.get(address.toLowerCase()) ?? [])].reverse()
}
export function latestEvents(limit: number, offset = 0, types?: EventType[]): ChainEvent[] {
  const src = types && types.length ? eventsDesc.filter((e) => types.includes(e.type)) : eventsDesc
  return src.slice(offset, offset + limit)
}
export function countEvents(types?: EventType[]): number {
  if (!types || !types.length) return eventsDesc.length
  return eventsDesc.filter((e) => types.includes(e.type)).length
}

/* ------------------------------------------------------------------ blocks */

/**
 * Artwork pool handed to the live generator so tip blocks reference real
 * objects. Built once, lazily, from the indexed set.
 */
let poolCache: SpriteRef[] | null = null
export function spritePool(size = 120): SpriteRef[] {
  if (poolCache) return poolCache
  const sheetBySlug = new Map(collections.map((c) => [c.slug, c.sheet]))
  poolCache = objects
    .filter((o) => !o.burned)
    .slice(0, size)
    .map((o) => ({
      key: o.key,
      slug: o.slug,
      tokenId: o.tokenId,
      name: o.name,
      sheet: sheetBySlug.get(o.slug) ?? '/objects/gifcats.png',
      cell: o.cell,
      filter: o.filter,
    }))
  return poolCache
}

/** Present a generated tip block in the same shape as an indexed one. */
function liveToBlock(lb: LiveBlock): Block {
  const events: ChainEvent[] = lb.txs.map((t) => ({
    hash: t.hash,
    type: t.kind,
    height: t.height,
    ts: t.ts,
    index: t.index,
    objectKey: t.ref?.key ?? null,
    slug: t.ref?.slug ?? null,
    from: t.from,
    to: t.to,
    price: t.price,
    fee: t.fee,
    gasUsed: t.gasUsed,
    nonce: t.index,
    status: t.status,
  }))
  return {
    height: lb.height,
    hash: lb.hash,
    parentHash: lb.parentHash,
    stateRoot: lb.stateRoot,
    objectRoot: lb.objectRoot,
    ts: lb.ts,
    sequencer: lb.sequencer,
    txCount: lb.txCount,
    mints: lb.mints,
    transfers: lb.transfers,
    burns: lb.burns,
    sales: lb.sales,
    collections: [...new Set(events.map((e) => e.slug).filter(Boolean) as string[])],
    gasUsed: lb.gasUsed,
    gasLimit: lb.gasLimit,
    baseFee: lb.baseFee,
    fees: lb.fees,
    size: lb.size,
    events,
  }
}

export function getBlock(height: number): Block | null {
  if (!Number.isFinite(height) || height < 1 || height > liveHead()) return null
  // Above the index the chain is generated on demand, so the tip is always
  // browsable no matter how long this process has been running.
  if (height > INDEX_HEAD) return liveToBlock(liveBlockAt(height, spritePool()))
  const r = rngFor(`block:${height}`)
  const evs = eventsByHeight.get(height) ?? []
  const gasUsed = evs.reduce((a, e) => a + e.gasUsed, 0) + int(r, 21_000, 64_000)
  const fees = evs.reduce((a, e) => a + e.fee, 0)
  return {
    height,
    hash: '0x' + hexFrom(`blockhash:${height}`, 64),
    parentHash: '0x' + hexFrom(`blockhash:${height - 1}`, 64),
    stateRoot: '0x' + hexFrom(`stateroot:${height}`, 64),
    objectRoot: '0x' + hexFrom(`objectroot:${height}`, 64),
    ts: heightToTs(height),
    sequencer: SEQUENCERS[Math.floor(r() * SEQUENCERS.length)],
    txCount: evs.length,
    mints: evs.filter((e) => e.type === 'MINT').length,
    transfers: evs.filter((e) => e.type === 'TRANSFER' || e.type === 'SALE').length,
    burns: evs.filter((e) => e.type === 'BURN').length,
    sales: evs.filter((e) => e.type === 'SALE').length,
    collections: [...new Set(evs.map((e) => e.slug).filter(Boolean) as string[])],
    gasUsed,
    gasLimit: 30_000_000,
    baseFee: Math.round((0.28 + r() * 0.9) * 100) / 100,
    fees: Math.round(fees * 10000) / 10000,
    size: 612 + evs.length * int(r, 820, 1640),
    events: evs,
  }
}

/** Newest blocks, counted down from the live head rather than the index. */
export function latestBlocks(limit: number, offset = 0): Block[] {
  const head = liveHead()
  const out: Block[] = []
  for (let i = 0; i < limit; i++) {
    const h = head - offset - i
    if (h < 1) break
    const b = getBlock(h)
    if (b) out.push(b)
  }
  return out
}

export function getBlockByHash(hash: string): Block | null {
  const target = hash.toLowerCase()
  const head = liveHead()
  for (let h = head; h > head - CHAIN.indexWindow; h--) {
    if ('0x' + hexFrom(`blockhash:${h}`, 64) === target) return getBlock(h)
  }
  return null
}

/* ------------------------------------------------------- derived statistics */

export interface CollectionStats {
  floor: number
  listed: number
  owners: number
  supply: number
  burned: number
  volume24h: number
  volumeTotal: number
  sales: number
  transfers: number
  change24h: number
  topSale: number
}

const statsCache = new Map<string, CollectionStats>()

export function collectionStats(slug: string): CollectionStats {
  const cached = statsCache.get(slug)
  if (cached) return cached
  const col = collectionBySlug.get(slug)!
  const items = objects.filter((o) => o.slug === slug)
  const acts = eventsBySlug.get(slug) ?? []
  const sales = acts.filter((e) => e.type === 'SALE' && e.status === 'success')
  const r = rngFor(`stats:${slug}`)
  const listedPrices = items.map((o) => o.listPrice).filter((p): p is number => p !== null)
  const floor = listedPrices.length ? Math.min(...listedPrices) : floorFor(slug)
  const stats: CollectionStats = {
    floor: Math.round(floor * 100) / 100,
    listed: listedPrices.length,
    owners: new Set(items.filter((o) => !o.burned).map((o) => o.owner)).size,
    supply: col.supply,
    burned: items.filter((o) => o.burned).length,
    volume24h: Math.round(sales.reduce((a, e) => a + (e.price ?? 0), 0) * 100) / 100,
    volumeTotal: Math.round((sales.reduce((a, e) => a + (e.price ?? 0), 0) + floor * col.supply * (2 + r() * 9)) * 100) / 100,
    sales: sales.length,
    transfers: acts.filter((e) => e.type === 'TRANSFER').length,
    change24h: Math.round((r() * 60 - 24) * 10) / 10,
    topSale: sales.length ? Math.max(...sales.map((e) => e.price ?? 0)) : Math.round(floor * 4 * 100) / 100,
  }
  statsCache.set(slug, stats)
  return stats
}

export function walletHoldings(address: string): GifObject[] {
  const a = address.toLowerCase()
  return objects.filter((o) => !o.burned && o.owner.toLowerCase() === a)
}

export function holdingsValue(address: string): number {
  return Math.round(
    walletHoldings(address).reduce((acc, o) => acc + (o.lastPrice ?? collectionStats(o.slug).floor), 0) * 100,
  ) / 100
}

export interface NetworkStats {
  height: number
  objects: number
  collections: number
  transfers24h: number
  mints24h: number
  sales24h: number
  volume24h: number
  activeWallets: number
  avgBlockTime: number
  txTotal: number
  gasPrice: number
  burned: number
  status: 'operational' | 'degraded'
}

let networkCache: NetworkStats | null = null

export function networkStats(): NetworkStats {
  // Height is deliberately outside the cache: the chain keeps moving.
  if (networkCache) return { ...networkCache, height: liveHead() }
  const sales = events.filter((e) => e.type === 'SALE' && e.status === 'success')
  networkCache = {
    height: liveHead(),
    objects: objects.filter((o) => !o.burned).length,
    collections: collections.length,
    transfers24h: events.filter((e) => e.type === 'TRANSFER').length * 12,
    mints24h: events.filter((e) => e.type === 'MINT').length * 4,
    sales24h: sales.length,
    volume24h: Math.round(sales.reduce((a, e) => a + (e.price ?? 0), 0) * 100) / 100,
    activeWallets: new Set(events.map((e) => e.from)).size * 37,
    avgBlockTime: measuredBlockTime(1000),
    txTotal: 88_412_907,
    gasPrice: 0.42,
    burned: objects.filter((o) => o.burned).length,
    status: 'operational',
  }
  return networkCache
}

export interface DayPoint {
  day: string
  mints: number
  transfers: number
  sales: number
  volume: number
  wallets: number
  fees: number
  blockTime: number
}

let seriesCache: DayPoint[] | null = null

export function dailySeries(): DayPoint[] {
  if (seriesCache) return seriesCache
  const out: DayPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const r = rngFor(`day:${i}`)
    const ts = blockTimeAt(INDEX_HEAD) - i * 86_400_000
    const d = new Date(ts)
    const pad = (n: number) => String(n).padStart(2, '0')
    out.push({
      day: `${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      mints: int(r, 900, 5200),
      transfers: int(r, 4200, 14800),
      sales: int(r, 600, 3100),
      volume: Math.round(int(r, 12_000, 96_000) / 10) * 10,
      wallets: int(r, 3400, 11200),
      fees: Math.round(int(r, 140, 920) * 1.13),
      blockTime: Math.round((3.8 + r() * 0.5) * 100) / 100,
    })
  }
  seriesCache = out
  return out
}

/* ------------------------------------------------------------------ search */

export type SearchResult =
  | { kind: 'block'; height: number; label: string; sub: string }
  | { kind: 'tx'; hash: string; label: string; sub: string }
  | { kind: 'object'; slug: string; tokenId: number; label: string; sub: string }
  | { kind: 'collection'; slug: string; label: string; sub: string }
  | { kind: 'wallet'; address: string; label: string; sub: string }

export function search(raw: string): SearchResult[] {
  const q = raw.trim().toLowerCase()
  if (!q) return []
  const out: SearchResult[] = []

  if (/^\d+$/.test(q)) {
    const h = parseInt(q, 10)
    if (h >= 1 && h <= liveHead()) {
      out.push({ kind: 'block', height: h, label: `Block #${h}`, sub: 'block height' })
    }
    for (const o of objects) {
      if (o.tokenId === h) {
        out.push({
          kind: 'object',
          slug: o.slug,
          tokenId: o.tokenId,
          label: o.name,
          sub: `token id ${o.tokenId}`,
        })
      }
    }
  }

  if (/^0x[0-9a-f]{64}$/.test(q)) {
    if (eventByHash.has(q)) out.push({ kind: 'tx', hash: q, label: q, sub: 'transaction hash' })
    const blk = getBlockByHash(q)
    if (blk) out.push({ kind: 'block', height: blk.height, label: `Block #${blk.height}`, sub: 'block hash' })
  }

  if (/^0x[0-9a-f]{40}$/.test(q)) {
    const col = collectionByContract.get(q)
    if (col) out.push({ kind: 'collection', slug: col.slug, label: col.name, sub: 'contract address' })
    else out.push({ kind: 'wallet', address: q, label: q, sub: 'address' })
  }

  for (const c of collections) {
    if (c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.slug.includes(q)) {
      out.push({ kind: 'collection', slug: c.slug, label: c.name, sub: `${c.symbol} \u00b7 collection` })
    }
  }

  for (const w of wallets) {
    if (w.handle?.toLowerCase().includes(q) || w.label?.toLowerCase().includes(q)) {
      out.push({
        kind: 'wallet',
        address: w.address,
        label: w.handle ?? w.label ?? w.address,
        sub: 'wallet',
      })
    }
  }

  if (q.length >= 3) {
    for (const o of objects) {
      if (out.length > 60) break
      if (o.name.toLowerCase().includes(q)) {
        out.push({
          kind: 'object',
          slug: o.slug,
          tokenId: o.tokenId,
          label: o.name,
          sub: `object \u00b7 ${o.slug}`,
        })
      }
    }
  }

  return out.slice(0, 40)
}

/* --------------------------------------------------------------- selectors */

export function trendingCollections(): Array<Collection & { stats: CollectionStats }> {
  return collections
    .map((c) => ({ ...c, stats: collectionStats(c.slug) }))
    .sort((a, b) => b.stats.volume24h - a.stats.volume24h)
}

export function recentMints(limit: number): Array<{ event: ChainEvent; object: GifObject }> {
  const out: Array<{ event: ChainEvent; object: GifObject }> = []
  for (const e of eventsDesc) {
    if (e.type !== 'MINT' || !e.objectKey) continue
    const o = objectByKey.get(e.objectKey)
    if (!o) continue
    out.push({ event: e, object: o })
    if (out.length >= limit) break
  }
  return out
}

export function topWallets(limit: number): Array<{ wallet: Wallet; count: number; value: number }> {
  const counts = new Map<string, number>()
  for (const o of objects) {
    if (o.burned) continue
    counts.set(o.owner, (counts.get(o.owner) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([address, count]) => ({
      wallet: getWallet(address)!,
      count,
      value: holdingsValue(address),
    }))
    .filter((w) => w.wallet && w.wallet.kind === 'account')
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export function relatedObjects(obj: GifObject, limit: number): GifObject[] {
  return objects
    .filter((o) => o.slug === obj.slug && o.key !== obj.key && !o.burned)
    .slice(0, limit)
}
