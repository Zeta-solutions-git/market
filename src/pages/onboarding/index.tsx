import { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import appConfig from 'app.config.cjs'
import Page from '@shared/Page'
import Loader from '@shared/atoms/Loader'
import { useAuth } from '@hooks/useAuth'
import { useSsiWallet } from '@context/SsiWallet'
import { clearPendingAuthMode } from '@utils/authFlow'
import BrandPanel from '../../components/Auth/AuthLayout/BrandPanel'
import SetupPanel from '../../components/Auth/AuthLayout/SetupPanel'
import type { AuthFeature } from '../../components/Auth/constants'
import styles from '../../components/Auth/AuthLayout/index.module.css'
import content from '../../../content/auth/login.json'

// Post-login onboarding (connect web3 wallet + SSI). This is where the OIDC
// callback lands after Authentik auth; when setup is complete it forwards to
// the original destination. Logging in/out no longer routes here — Authentik is
// the single login entry point, so this page is onboarding-only.
export default function OnboardingPage(): ReactElement {
  const { isAuthenticated, isLoading, authEnabled } = useAuth()
  const { isConnected } = useAccount()
  const { sessionToken, isSsiStateHydrated } = useSsiWallet()
  const router = useRouter()
  const { callbackUrl } = router.query
  const isSsiEnabled = appConfig.ssiEnabled

  // Not authenticated -> send to Authentik login (this page is post-login only)
  useEffect(() => {
    if (!router.isReady) return
    if (!authEnabled) {
      router.replace('/')
      return
    }
    if (!isLoading && !isAuthenticated) {
      const target =
        typeof callbackUrl === 'string' && callbackUrl ? callbackUrl : '/'
      window.location.href = `/api/auth/login?callbackUrl=${encodeURIComponent(
        target
      )}`
    }
  }, [router, authEnabled, isLoading, isAuthenticated, callbackUrl])

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
                <SetupPanel />
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
