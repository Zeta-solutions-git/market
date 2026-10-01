import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'

// Temporary hackathon config (challenge folders in the catalogue). Read from a
// file mounted into the container, so it can be edited live; a missing file or
// "enabled": false simply turns the feature off. See hackathon/README.md.
const FILE = process.env.HACKATHON_FILE || '/app/hackathon/hackathon.json'
const DID = /^did:[a-z0-9]+:[A-Za-z0-9._:-]+$/

export type HackathonChallenge = {
  id: string
  name: string
  description: string
  datasets: string[]
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

async function readConfig(): Promise<HackathonConfig> {
  try {
    const raw = JSON.parse(await fs.readFile(FILE, 'utf8'))
    if (!raw || raw.enabled === false || !Array.isArray(raw.challenges)) {
      return OFF
    }
    const challenges = raw.challenges
      .map((c: Record<string, unknown>, i: number) => ({
        id: str(c?.id, 20) || String(i + 1),
        name: str(c?.name, 80),
        description: str(c?.description, 300),
        datasets: Array.isArray(c?.datasets)
          ? [
              ...new Set(
                (c.datasets as unknown[])
                  .map((d) => str(d, 200))
                  .filter((d) => DID.test(d))
              )
            ]
          : []
      }))
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  res.setHeader('Cache-Control', 'public, max-age=10')
  return res.status(200).json(await readConfig())
}
