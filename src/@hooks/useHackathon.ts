import { useEffect, useState } from 'react'
import type {
  HackathonChallenge,
  HackathonConfig
} from '../pages/api/hackathon'

export type { HackathonChallenge, HackathonConfig }

// Temporary: hackathon challenge folders (see hackathon/README.md). One fetch
// per page load, shared by the catalogue and every asset card.
let cached: Promise<HackathonConfig | undefined> | undefined

function load(): Promise<HackathonConfig | undefined> {
  if (!cached) {
    cached = fetch('/api/hackathon')
      .then((r) => (r.ok ? (r.json() as Promise<HackathonConfig>) : undefined))
      .catch(() => undefined)
  }
  return cached
}

export function useHackathon(): {
  config?: HackathonConfig
  loaded: boolean
  challengesFor: (did: string) => HackathonChallenge[]
} {
  const [config, setConfig] = useState<HackathonConfig>()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let active = true
    load().then((c) => {
      if (!active) return
      setConfig(c?.enabled ? c : undefined)
      setLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  const challengesFor = (did: string) =>
    config?.challenges.filter((c) => c.datasets.includes(did)) || []

  return { config, loaded, challengesFor }
}
