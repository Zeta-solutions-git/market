import { useEffect, ReactNode, useState } from 'react'
import { useRouter } from 'next/router'
import { useAuth, verifyAuthSessionDetailed } from '@hooks/useAuth'
import Loader from '@shared/atoms/Loader'

interface AuthGuardProps {
  children: ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, authEnabled, clearLocalSession } =
    useAuth()
  const router = useRouter()
  const [isRouteSessionChecking, setIsRouteSessionChecking] = useState(false)

  const isPublicRoute = (): boolean => {
    const path = router.asPath.split('?')[0]

    // Keep the 404 page visible to logged-out visitors. asPath is the bad URL,
    // so match on pathname instead. A truly unmatched URL renders pathname
    // '/404'; an unknown single-segment slug is matched by '/[slug]' (which
    // returns notFound) and keeps that pathname while rendering the 404. The
    // '/[slug]' route only ever serves public markdown pages or the 404, so
    // treating it as public is safe.
    if (
      router.pathname === '/404' ||
      router.pathname === '/_error' ||
      router.pathname === '/[slug]'
    ) {
      return true
    }

    const exactPublicPaths = [
      '/',
      '/onboarding',
      '/auth/callback',
      '/about',
      '/about-us',
      '/projects',
      '/the-team',
      '/contact',
      '/terms',
      '/privacy',
      '/imprint',
      '/cookie-settings'
    ]

    if (exactPublicPaths.includes(path)) {
      return true
    }

    if (path.startsWith('/privacy/')) {
      return true
    }

    if (path.startsWith('/auth/')) {
      return true
    }

    return false
  }

  const isPublic = isPublicRoute()
  const shouldRedirectToLogin =
    authEnabled && !isLoading && !isAuthenticated && !isPublic

  useEffect(() => {
    if (!router.isReady) return
    if (!authEnabled || isPublic || !isAuthenticated) return

    let cancelled = false

    const verifyRouteSession = async () => {
      setIsRouteSessionChecking(true)
      try {
        const result = await verifyAuthSessionDetailed()
        if (cancelled) return

        if (!result.user) {
          clearLocalSession('/api/auth/logout')
        }
      } catch (error) {
        console.error('Route session verification failed:', error)
      } finally {
        if (!cancelled) setIsRouteSessionChecking(false)
      }
    }

    verifyRouteSession()

    return () => {
      cancelled = true
    }
  }, [
    authEnabled,
    clearLocalSession,
    isAuthenticated,
    isPublic,
    router.pathname,
    router.isReady
  ])

  useEffect(() => {
    if (shouldRedirectToLogin) {
      // Go straight to the Authentik login flow (via the /api/auth/login OIDC
      // redirect) instead of the intermediate market /auth/login page.
      window.location.href = `/api/auth/login?callbackUrl=${encodeURIComponent(
        router.asPath
      )}`
    }
  }, [router.asPath, shouldRedirectToLogin])

  if (!authEnabled) {
    return <>{children}</>
  }

  if (
    (isLoading && !isPublic) ||
    isRouteSessionChecking ||
    shouldRedirectToLogin
  ) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Loader variant="primary" noMargin />
      </div>
    )
  }

  return <>{children}</>
}
