import { LoggerInstance } from '@oceanprotocol/lib'
import { serverSideDeleteIpfsFile, serverSideUploadToIpfs } from '@utils/ipfs'
import { getRuntimeConfig } from '@utils/runtimeConfig'
import { NextApiRequest, NextApiResponse } from 'next'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from './auth/_cookies'
import { getVerifiedSessionClaims } from './auth/_session'

const IPFS_JWT_ENV_KEY = 'IPFS_JWT'

function getHeaderValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || ''
}

// Same rules as the signer-server proxy: a browser Origin, when sent, must be
// this site, and state-changing calls need the double-submit CSRF token.
function isAllowedOrigin(req: NextApiRequest): boolean {
  const origin = getHeaderValue(req.headers.origin)
  if (!origin) return true
  const host = getHeaderValue(req.headers.host)
  const proto =
    getHeaderValue(req.headers['x-forwarded-proto']).split(',')[0]?.trim() ||
    'https'
  return origin === `${proto}://${host}`
}

function hasValidCsrfToken(req: NextApiRequest): boolean {
  const cookieToken = req.cookies[CSRF_COOKIE_NAME]
  const headerToken = getHeaderValue(req.headers[CSRF_HEADER_NAME])
  return Boolean(cookieToken && headerToken && cookieToken === headerToken)
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE')
    return res
      .status(405)
      .json({ success: false, message: 'Method not allowed' })
  }

  // Uploads go to our pinning account: only logged-in users of this site.
  if (!isAllowedOrigin(req) || !hasValidCsrfToken(req)) {
    return res.status(403).json({ success: false, message: 'Forbidden' })
  }
  const claims = await getVerifiedSessionClaims(req)
  if (!claims) {
    return res
      .status(401)
      .json({ success: false, message: 'Login is required.' })
  }

  const ipfsJWT = process.env[IPFS_JWT_ENV_KEY]
  const runtimeConfig = getRuntimeConfig()
  const ipfsUploadUrl = runtimeConfig.NEXT_PUBLIC_IPFS_UPLOAD_URL
  const ipfsDeleteUrl = runtimeConfig.NEXT_PUBLIC_IPFS_DELETE_URL

  if (req.method === 'POST') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const data = await serverSideUploadToIpfs(body, ipfsJWT, ipfsUploadUrl)
      return res.status(200).json({ success: true, data })
    } catch (error) {
      LoggerInstance.error(error.message)
      return res.status(500).json({
        success: false,
        error: 'Could not upload the file to the IPFS provider'
      })
    }
  }

  try {
    await serverSideDeleteIpfsFile(req.body, ipfsJWT, ipfsDeleteUrl)
    return res.status(200).json({ success: true })
  } catch (error) {
    LoggerInstance.error(error.message)
    return res.status(500).json({
      success: false,
      error: 'Could not delete the file on the IPFS provider'
    })
  }
}
