import * as isIPFS from 'is-ipfs'
import { FileItem } from '@utils/fileItem'
import { RemoteSource } from '../@types/ddo/RemoteSource'
import axios from 'axios'
import { getCookieValue } from '@utils/cookies'

// /api/ipfs requires the session + double-submit CSRF token (see the route).
function ipfsApiHeaders(): Record<string, string> {
  const csrfToken = getCookieValue('__Host-csrf_token')
  return csrfToken ? { 'X-CSRF-Token': csrfToken } : {}
}

export interface IpfsRemoteDocument {
  content: string
  filename: string
}

export function isCID(value: string) {
  return isIPFS.cid(value)
}

export async function serverSideUploadToIpfs(
  data: any,
  ipfsJWT: string,
  ipfsUploadUrl: string
): Promise<string> {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[serverSideUploadToIpfs] serverSideUploadToIpfs is not allowed to run on client side'
    )
  }

  if (!ipfsJWT) {
    throw new Error('[serverSideUploadToIpfs] Set IPFS_JWT')
  }

  if (!ipfsUploadUrl) {
    throw new Error('[serverSideUploadToIpfs] Set NEXT_PUBLIC_IPFS_UPLOAD_URL')
  }

  try {
    const ipfsContent = {
      pinataContent: data
    }
    const response = await axios.post(ipfsUploadUrl, ipfsContent, {
      headers: {
        'Content-Type': 'application/json',
        // 🔑 Use the API Key and Secret Key in the headers for authentication
        Authorization: `Bearer ${ipfsJWT}`
      }
    })

    return response.data.IpfsHash
  } catch (error) {
    throw new Error(`[serverSideUploadToIpfs] ${error.message}`)
  }
}

export async function uploadToIPFS(data: any): Promise<string> {
  try {
    const res = await fetch('/api/ipfs', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...ipfsApiHeaders() },
      body: JSON.stringify(data)
    })

    const result = await res.json()
    if (!result.success) {
      throw new Error(result.message || result.error)
    }
    return result.data
  } catch (error) {
    throw new Error(`[uploadToIPFS] ${error.message}`)
  }
}

export async function serverSideDeleteIpfsFile(
  ipfsHash: string,
  ipfsJWT: string,
  ipfsDeleteUrl: string
) {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[serverSideDeleteIpfsFile] serverSideDeleteIpfsFile is not allowed to run on client side'
    )
  }

  if (!ipfsJWT) {
    throw new Error('[serverSideDeleteIpfsFile] Set IPFS_JWT')
  }

  if (!ipfsDeleteUrl) {
    throw new Error(
      '[serverSideDeleteIpfsFile] Set NEXT_PUBLIC_IPFS_DELETE_URL'
    )
  }

  try {
    await axios.delete(`${ipfsDeleteUrl}/${ipfsHash}`, {
      headers: {
        // 🔑 Use the JWT as the Bearer Token for authorization
        Authorization: `Bearer ${ipfsJWT}`
      }
    })
  } catch (error) {
    throw new Error(`[serverSideDeleteIpfsFile] ${error.message}`)
  }
}

export async function deleteIpfsFile(ipfsHash: string) {
  try {
    const res = await fetch('/api/ipfs', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: ipfsApiHeaders(),
      body: ipfsHash
    })

    const result = await res.json()
    if (!result.success) {
      throw new Error(result.message)
    }
  } catch (error) {
    throw new Error(`[deleteIpfsFile] ${error.message}`)
  }
}

export async function uploadFileItemToIPFS(
  fileItem: FileItem
): Promise<RemoteSource> {
  const remoteDocument: IpfsRemoteDocument = {
    content: fileItem.content,
    filename: fileItem.name
  }

  const ipfsHash = await uploadToIPFS(remoteDocument)
  return {
    type: 'ipfs',
    ipfsCid: ipfsHash,
    headers: {}
  }
}

export async function downloadRemoteSourceFromIpfs(
  ipfsHash: string,
  ipfsGateway: string
): Promise<IpfsRemoteDocument | null> {
  if (!ipfsGateway) {
    throw new Error('[downloadRemoteSourceFromIpfs] Set IPFS_GATEWAY')
  }

  try {
    const response = await axios.get(`${ipfsGateway}/ipfs/${ipfsHash}`)
    return response.data
  } catch (error) {
    throw new Error(`[downloadRemoteSourceFromIpfs] ${error.message}`)
  }
}
