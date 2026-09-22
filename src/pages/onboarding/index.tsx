import { ReactElement, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import appConfig from 'app.config.cjs'
import Page from '@shared/Page'
import Loader from '@shared/atoms/Loader'
import { useAuth } from '@hooks/useAuth'
import { useSsiWallet } from '@context/SsiWallet'
import { useSignerServerConnect } from '@hooks/useSignerServerConnect'
import useSsiConnect from '@hooks/useSsiConnect'
import { clearPendingAuthMode } from '@utils/authFlow'
import BrandPanel from '../../components/Auth/AuthLayout/BrandPanel'
import SetupPanel from '../../components/Auth/AuthLayout/SetupPanel'
import type { AuthFeature } from '../../components/Auth/constants'
import styles from '../../components/Auth/AuthLayout/index.module.css'
import content from '../../../content/auth/login.json'

// How long to let the automatic (Signer Server) setup run before revealing the
// manual wallet chooser as a fallback. The identity-derived connect is a couple
// of API calls, so this only matters when something is actually stuck.
const AUTO_SETUP_GRACE_MS = 8000

// Post-login onboarding (connect web3 wallet + SSI). This is where the OIDC
// callback lands after Authentik auth; when setup is complete it forwards to
// the original destination. Logging in/out no longer routes here — Authentik is
// the single login entry point, so this page is onboarding-only.
//
// Per the OE "basic account abstraction" model, the Signer Server wallet is
// derived from the authenticated identity and must be requested automatically
// on each session — there is no manual connect step for it. So when the Signer
// Server is configured we auto-connect the wallet (and SSI) silently and just
// forward. The manual chooser (MetaMask etc.) is kept as a fallback for
// deployments without a Signer Server, or if auto-connect can't complete.
export default function OnboardingPage(): ReactElement {
  const { isAuthenticated, isLoading, authEnabled, isLogoutPending } = useAuth()
  const { isConnected } = useAccount()
  const { sessionToken, isSsiStateHydrated, isSsiSessionHydrating } =
    useSsiWallet()
  const {
    connect: connectSignerServer,
    isConfigured: isSignerServerConfigured,
    isHealthChecked: isSignerServerHealthChecked
  } = useSignerServerConnect()
  const { connectSsi } = useSsiConnect()
  const router = useRouter()
  const { callbackUrl } = router.query
  const isSsiEnabled = appConfig.ssiEnabled

  const walletAttemptedRef = useRef(false)
  const ssiAttemptedRef = useRef(false)
  const [autoSetupStalled, setAutoSetupStalled] = useState(false)

  const isWalletReady = isConnected
  const isSsiReady = Boolean(sessionToken)
  const isSetupReady = isSsiEnabled
    ? isWalletReady && isSsiStateHydrated && isSsiReady
    : isWalletReady

  // This page is post-login only. If there's no session, send the visitor to
  // home (a public page) rather than back to Authentik login — redirecting to
  // login here would re-auth against a still-live Authentik session and loop.
  // Also stand down while a logout is in flight so the logout navigation wins.
  useEffect(() => {
    if (!router.isReady) return
    if (!authEnabled) {
      router.replace('/')
      return
    }
    if (isLogoutPending) return
    if (!isLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [router, authEnabled, isLoading, isAuthenticated, isLogoutPending])

  // Auto-connect the identity-derived Signer Server wallet (account
  // abstraction: no manual step per session). Fires once the health check has
  // confirmed a Signer Server is available for this session.
  useEffect(() => {
    if (!isAuthenticated || isLogoutPending) return
    if (isConnected) return
    if (!isSignerServerConfigured) return
    if (walletAttemptedRef.current) return

    walletAttemptedRef.current = true
    connectSignerServer().catch(() => undefined)
  }, [
    isAuthenticated,
    isLogoutPending,
    isConnected,
    isSignerServerConfigured,
    connectSignerServer
  ])

  // Once the wallet is connected, auto-connect SSI too. The custodial wallet
  // signs the SSI challenge without a popup, so this needs no user action.
  useEffect(() => {
    if (!isAuthenticated || isLogoutPending) return
    if (!isSsiEnabled) return
    if (!isConnected) return
    if (!isSsiStateHydrated) return
    if (sessionToken || isSsiSessionHydrating) return
    if (ssiAttemptedRef.current) return

    ssiAttemptedRef.current = true
    connectSsi().catch(() => undefined)
  }, [
    isAuthenticated,
    isLogoutPending,
    isSsiEnabled,
    isConnected,
    isSsiStateHydrated,
    sessionToken,
    isSsiSessionHydrating,
    connectSsi
  ])

  // Watchdog: if we're mid auto-setup but nothing is ready after a grace
  // period, reveal the manual chooser so the user is never stuck on a spinner.
  useEffect(() => {
    if (!isAuthenticated || isLogoutPending) return
    if (isSetupReady) return
    if (!isConnected && !isSignerServerConfigured) return

    const timeoutId = window.setTimeout(
      () => setAutoSetupStalled(true),
      AUTO_SETUP_GRACE_MS
    )
    return () => window.clearTimeout(timeoutId)
  }, [
    isAuthenticated,
    isLogoutPending,
    isSetupReady,
    isConnected,
    isSignerServerConfigured
  ])

  // Setup complete -> forward to the original destination
  useEffect(() => {
    if (!isAuthenticated) return
    if (!isConnected) return
    if (isSsiEnabled) {
      if (!isSsiStateHydrated) return
      if (!sessionToken) return
    }

    const redirectTo =
      (callbackUrl as string) ||
      '/search?sort=indexedMetadata.event.block&sortOrder=desc'
    const timeoutId = window.setTimeout(() => {
      clearPendingAuthMode()
      router.replace(redirectTo)
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [
    callbackUrl,
    isAuthenticated,
    isConnected,
    isSsiEnabled,
    isSsiStateHydrated,
    router,
    sessionToken
  ])

  const { title, description, features } = content

  // Nothing to auto-connect (no Signer Server for this session) or auto-setup
  // stalled -> fall back to the manual wallet chooser (MetaMask etc.).
  const showManualPanel =
    autoSetupStalled ||
    (isSignerServerHealthChecked && !isSignerServerConfigured && !isConnected)

  return (
    <Page
      title="Finish setting up your account"
      description={description}
      uri={router.route}
      noPageHeader
      fullWidth
    >
      {authEnabled && isAuthenticated ? (
        <div className={styles.page}>
          <div className={styles.card}>
            <BrandPanel
              content={{
                title,
                description,
                features: features as AuthFeature[]
              }}
            />
            <div className={styles.formPanel}>
              <div className={styles.formContent}>
                {showManualPanel ? (
                  <SetupPanel />
                ) : (
                  <div className={styles.autoSetup}>
                    <Loader variant="primary" noMargin />
                    <p className={styles.autoSetupText}>
                      {isSetupReady
                        ? 'Access ready. Redirecting you now…'
                        : 'Setting up your account…'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Loader variant="primary" noMargin />
        </div>
      )}
    </Page>
  )
}
