import { useCallback, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { LoggerInstance } from '@oceanprotocol/lib'
import { useAuth } from '@hooks/useAuth'
import { useSsiWallet } from '@context/SsiWallet'
import { disconnectFromWallet } from '@utils/wallet/ssiWallet'
import { clearFederatedStorage } from '@utils/logoutRouter'

// Full marketplace sign-out: web3 wallet disconnect, SSI wallet cleanup,
// federated storage cleanup and finally the OIDC logout. Mirrors the logic
// that used to live in Header/Wallet/Details.tsx (handleLogout).
export function useSignOut(): {
  signOut: () => Promise<void>
  isSigningOut: boolean
} {
  const { address: accountId } = useAccount()
  const { disconnect } = useDisconnect()
  const { logout, markLogoutPending } = useAuth()
  const {
    setSessionToken,
    ssiWalletCache,
    setCachedCredentials,
    clearVerifierSessionCache
  } = useSsiWallet()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const disconnectSsiWallet = useCallback(async () => {
    try {
      ssiWalletCache.clearCredentials()
      setCachedCredentials([])
      clearVerifierSessionCache()
      disconnectFromWallet()
      setSessionToken(undefined)
    } catch (error) {
      LoggerInstance.error(error)
    }
  }, [
    ssiWalletCache,
    setCachedCredentials,
    clearVerifierSessionCache,
    setSessionToken
  ])

  const handleDisconnectWallet = useCallback(async () => {
    disconnect()
    // eslint-disable-next-line promise/param-names
    await new Promise((r) => setTimeout(r, 500))
    await disconnectSsiWallet()
  }, [disconnect, disconnectSsiWallet])

  const signOut = useCallback(async () => {
    if (isSigningOut) return
    setIsSigningOut(true)
    markLogoutPending()

    try {
      if (accountId) {
        await handleDisconnectWallet()
      } else {
        await disconnectSsiWallet()
      }
    } catch (error) {
      console.error('wallet logout error', error)
    }

    clearFederatedStorage()
    try {
      await logout()
    } finally {
      setIsSigningOut(false)
    }
  }, [
    isSigningOut,
    markLogoutPending,
    accountId,
    handleDisconnectWallet,
    disconnectSsiWallet,
    logout
  ])

  return { signOut, isSigningOut }
}

export default useSignOut
