import { formatEther } from 'ethers'
import type { Address, Hex } from 'viem'
import { getCookieValue } from '../cookies'

export type SignerServerNetwork = {
  chainId: number
  name?: string
}

export type SignerServerAddress = {
  walletId?: number
  address: Address
}

export type SignerServerTransactionResult = {
  hash: Hex
  from: Address
  to: Address | null
  nonce: number
}

export type SignerServerMessageInput = { message: string } | { rawMessage: Hex }

const SIGNER_SERVER_HEALTH_PATH = 'health'
const SIGNER_SERVER_HEALTHY_STATUS = 'ok'
const CSRF_COOKIE_NAME = '__Host-csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

type SignerServerHealthResponse = {
  status?: string
}

// Our proxy answers with { error }, the signer server itself with { message }
type SignerServerErrorResponse = {
  error?: string
  message?: string | string[]
}

const INSUFFICIENT_FUNDS_PATTERN = /has (\d+) wei, needs at least (\d+) wei/i

export class SignerServerError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SignerServerError'
    this.status = status
  }
}

export class InsufficientFundsError extends SignerServerError {
  constructor(message: string, status: number) {
    super(message, status)
    this.name = 'InsufficientFundsError'
  }
}

// ocean.js catches failed sends and returns null, so the reason is lost
// before it reaches the order flow. Keep the last failure to rethrow there.
let lastSignerServerError: SignerServerError | undefined

export function clearLastSignerServerError() {
  lastSignerServerError = undefined
}

export function takeLastSignerServerError() {
  const error = lastSignerServerError
  lastSignerServerError = undefined
  return error
}

function formatWeiAsEth(wei: string): string {
  const eth = Number(formatEther(BigInt(wei)))
  return `${eth.toLocaleString('en-US', { maximumSignificantDigits: 4 })} ETH`
}

function toSignerServerError(
  data: SignerServerErrorResponse,
  status: number
): SignerServerError {
  const serverMessage =
    data.error ||
    (Array.isArray(data.message) ? data.message.join(', ') : data.message) ||
    'Signer server request failed.'

  if (!/insufficient funds/i.test(serverMessage)) {
    return new SignerServerError(serverMessage, status)
  }

  const amounts = serverMessage.match(INSUFFICIENT_FUNDS_PATTERN)
  const message = amounts
    ? `Insufficient funds: your wallet has ${formatWeiAsEth(
        amounts[1]
      )}, but this transaction needs at least ${formatWeiAsEth(
        amounts[2]
      )} for gas. Please top up your wallet and try again.`
    : 'Insufficient funds: your wallet does not have enough ETH to pay for this transaction. Please top up your wallet and try again.'

  return new InsufficientFundsError(message, status)
}

async function signerServerRequest<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const method = init?.method?.toUpperCase() || 'GET'
  const csrfToken = method === 'POST' ? getCookieValue(CSRF_COOKIE_NAME) : ''

  const response = await fetch(`/api/signer-server/${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
      ...(init?.headers || {})
    }
  })
  const data = (await response
    .json()
    .catch(() => ({}))) as SignerServerErrorResponse

  if (!response.ok) {
    const error = toSignerServerError(data, response.status)
    lastSignerServerError = error
    throw error
  }

  return data as T
}

export async function checkSignerServerHealth() {
  try {
    const response = await fetch(
      `/api/signer-server/${SIGNER_SERVER_HEALTH_PATH}`,
      {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      }
    )

    if (!response.ok) return false

    const data = (await response
      .json()
      .catch(() => ({}))) as SignerServerHealthResponse

    return data.status === SIGNER_SERVER_HEALTHY_STATUS
  } catch {
    return false
  }
}

export async function getSignerServerNetworks() {
  const result = await signerServerRequest<{ networks: SignerServerNetwork[] }>(
    'available-networks'
  )

  return result.networks
}

export async function getSignerServerAddress() {
  return signerServerRequest<SignerServerAddress>('address')
}

export async function signSignerServerMessage(input: SignerServerMessageInput) {
  const result = await signerServerRequest<{ signature: Hex }>('sign-message', {
    method: 'POST',
    body: JSON.stringify(input)
  })

  return result.signature
}

export async function sendSignerServerTransaction(input: {
  chainId: number
  to: Address
  value?: string
  data?: Hex
}) {
  return signerServerRequest<SignerServerTransactionResult>(
    'send-transaction',
    {
      method: 'POST',
      body: JSON.stringify(input)
    }
  )
}
