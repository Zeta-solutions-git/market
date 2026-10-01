import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'

// Temporary hackathon config (challenge folders in the catalogue). Read from a
// file mounted into the container, so it can be edited live; a missing file or
// "enabled": false simply turns the feature off. See hackathon/README.md.
//
// Per challenge: "datasets" (DIDs), "match" (case-insensitive parts of asset
// names, resolved against the node so newly published assets show up by
// themselves; only assets from "publishers" count) and "links" (external
// pages shown as cards that open the page instead of an asset).
const FILE = process.env.HACKATHON_FILE || '/app/hackathon/hackathon.json'
const DID = /^did:[a-z0-9]+:[A-Za-z0-9._:-]+$/
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const CACHE_MS = 15_000

export type HackathonLink = {
  title: string
  url: string
  description: string
}

export type HackathonChallenge = {
  id: string
  name: string
  description: string
  datasets: string[]
  links: HackathonLink[]
}

export type HackathonConfig = {
  enabled: boolean
  title: string
  description: string
  challenges: HackathonChallenge[]
}

const OFF: HackathonConfig = {
  enabled: false,
  title: '',
  description: '',
  challenges: []
}

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : ''
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function nodeUrl(): string | undefined {
  try {
    const raw = process.env.NEXT_PUBLIC_METADATACACHE_URI || ''
    const first = raw.trim().startsWith('[') ? JSON.parse(raw)[0] : raw
    return typeof first === 'string' && first
      ? first.replace(/\/$/, '')
      : undefined
  } catch {
    return undefined
  }
}

// active assets of the given publishers: [{ id, name }]
async function publishedAssets(
  publishers: string[]
): Promise<{ id: string; name: string }[]> {
  const base = nodeUrl()
  if (!base || publishers.length === 0) return []
  const lower = publishers.map((p) => p.toLowerCase())
  const res = await fetch(`${base}/api/aquarius/assets/metadata/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: {
        bool: { filter: [{ term: { 'indexedMetadata.nft.state': 0 } }] }
      },
      size: 1000,
      _source: [
        'id',
        'credentialSubject.metadata.name',
        'indexedMetadata.nft.owner'
      ]
    }),
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) return []
  const data = await res.json()
  const results = (Array.isArray(data) ? data[0]?.results : data?.results) || []
  return results
    .filter((a: any) =>
      lower.includes(String(a?.indexedMetadata?.nft?.owner || '').toLowerCase())
    )
    .map((a: any) => ({
      id: String(a.id),
      name: String(a?.credentialSubject?.metadata?.name || '')
    }))
}

async function readConfig(): Promise<HackathonConfig> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, 'utf8'))
    if (!raw || raw.enabled === false || !Array.isArray(raw.challenges)) {
      return OFF
    }
    const publishers = list(raw.publishers)
      .map((p) => str(p, 42))
      .filter((p) => ADDRESS.test(p))
    const needsNode = raw.challenges.some(
      (c: Record<string, unknown>) => list(c?.match).length > 0
    )
    const assets = needsNode
      ? await publishedAssets(publishers).catch(() => [])
      : []

    const challenges = raw.challenges
      .map((c: Record<string, unknown>, i: number) => {
        const patterns = list(c?.match)
          .map((m) => str(m, 80).toLowerCase())
          .filter(Boolean)
        const matched = assets
          .filter((a) => patterns.some((p) => a.name.toLowerCase().includes(p)))
          .map((a) => a.id)
        const explicit = list(c?.datasets)
          .map((d) => str(d, 200))
          .filter((d) => DID.test(d))
        const links = list(c?.links)
          .map((l: any) => ({
            title: str(l?.title, 80),
            url: str(l?.url, 300),
            description: str(l?.description, 200)
          }))
          .filter((l) => l.title && /^https:\/\//.test(l.url))
        return {
          id: str(c?.id, 20) || String(i + 1),
          name: str(c?.name, 80),
          description: str(c?.description, 300),
          datasets: [...new Set([...explicit, ...matched])],
          links
        }
      })
      .filter((c: HackathonChallenge) => c.name)
    return {
      enabled: challenges.length > 0,
      title: str(raw.title, 80) || 'Hackathon challenges',
      description: str(raw.description, 300),
      challenges
    }
  } catch {
    return OFF
  }
}

let cache: { at: number; value: Promise<HackathonConfig> } | undefined

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!cache || Date.now() - cache.at > CACHE_MS) {
    cache = { at: Date.now(), value: readConfig() }
  }
  res.setHeader('Cache-Control', 'public, max-age=10')
  return res.status(200).json(await cache.value)
}
