import type { NextApiRequest, NextApiResponse } from 'next'

// Server-side JSON-RPC proxy. The browser talks to /api/rpc/<chainId>; only
// this route knows the real RPC URL (incl. the provider API key), taken from
// the server-only env RPC_URL_MAP = {"<chainId>":"https://…"}. Never put a
// keyed RPC URL in a NEXT_PUBLIC_* variable: those are shipped to every
// visitor via runtime-config.js.

export const config = {
  api: { bodyParser: { sizeLimit: '128kb' } }
}

// What wagmi/viem, ethers and ocean.js need from a public RPC. Anything else
// (debug_*, trace_*, admin_*, eth_sign*, personal_*, …) is refused.
const ALLOWED_METHODS = new Set([
  'eth_chainId',
  'net_version',
  'web3_clientVersion',
  'eth_blockNumber',
  'eth_syncing',
  'eth_call',
  'eth_estimateGas',
  'eth_gasPrice',
  'eth_maxPriorityFeePerGas',
  'eth_feeHistory',
  'eth_getBalance',
  'eth_getCode',
  'eth_getStorageAt',
  'eth_getTransactionCount',
  'eth_getTransactionByHash',
  'eth_getTransactionReceipt',
  'eth_getBlockByNumber',
  'eth_getBlockByHash',
  'eth_getBlockReceipts',
  'eth_getLogs',
  'eth_newFilter',
  'eth_newBlockFilter',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_uninstallFilter',
  'eth_sendRawTransaction',
  'eth_accounts'
])

const MAX_BATCH = 50
// Per client IP: JSON-RPC calls per minute (a batch counts per call).
const RATE_LIMIT = 1200
const RATE_WINDOW_MS = 60_000
const UPSTREAM_TIMEOUT_MS = 30_000

const hits = new Map<string, { count: number; start: number }>()

function rateLimited(ip: string, calls: number): boolean {
  const now = Date.now()
  if (hits.size > 10_000) {
    hits.forEach((v, k) => {
      if (now - v.start > RATE_WINDOW_MS) hits.delete(k)
    })
  }
  const entry = hits.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    hits.set(ip, { count: calls, start: now })
    return calls > RATE_LIMIT
  }
  entry.count += calls
  return entry.count > RATE_LIMIT
}

function getHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

// Same rule as the signer-server proxy: a browser Origin, when sent, must be
// this site (blocks other websites from using our RPC through visitors).
function isAllowedOrigin(req: NextApiRequest): boolean {
  const origin = getHeaderValue(req.headers.origin)
  if (!origin) return true
  const host = getHeaderValue(req.headers.host)
  const proto =
    getHeaderValue(req.headers['x-forwarded-proto']).split(',')[0]?.trim() ||
    'https'
  return origin === `${proto}://${host}`
}

function getUpstreamUrl(chainId: string): string | undefined {
  try {
    const map = JSON.parse(process.env.RPC_URL_MAP || '{}') as Record<
      string,
      unknown
    >
    const url = map[chainId]
    return typeof url === 'string' && /^https?:\/\//.test(url) ? url : undefined
  } catch {
    return undefined
  }
}

function rpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const chainId = getHeaderValue(req.query.chainId)
  const upstream = /^\d+$/.test(chainId) ? getUpstreamUrl(chainId) : undefined
  if (!upstream) {
    return res.status(404).json({ error: 'Unsupported chain' })
  }

  const { body } = req
  const calls: unknown[] = Array.isArray(body) ? body : [body]
  if (calls.length === 0 || calls.length > MAX_BATCH) {
    return res.status(400).json(rpcError(null, -32600, 'Invalid batch size'))
  }
  for (const call of calls) {
    const method = (call as { method?: unknown })?.method
    if (typeof method !== 'string' || !ALLOWED_METHODS.has(method)) {
      return res
        .status(400)
        .json(
          rpcError((call as { id?: unknown })?.id, -32601, 'Method not allowed')
        )
    }
  }

  // nginx sets X-Real-IP; the market itself is only bound to 127.0.0.1.
  const ip =
    getHeaderValue(req.headers['x-real-ip']) ||
    req.socket.remoteAddress ||
    'unknown'
  if (rateLimited(ip, calls.length)) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json(rpcError(null, -32005, 'Rate limit exceeded'))
  }

  try {
    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
    })
    const text = await response.text()
    res.status(response.status)
    res.setHeader(
      'Content-Type',
      response.headers.get('content-type') || 'application/json'
    )
    return res.send(text)
  } catch {
    // never echo the upstream error: it can contain the keyed URL
    return res.status(502).json(rpcError(null, -32603, 'RPC upstream error'))
  }
}
