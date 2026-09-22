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
  const { isAuthenticated, isLoading, authEnabled, isLogoutPending } = useAuth()
  const { isConnected } = useAccount()
  const { sessionToken, isSsiStateHydrated } = useSsiWallet()
  const router = useRouter()
  const { callbackUrl } = router.query
  const isSsiEnabled = appConfig.ssiEnabled

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
