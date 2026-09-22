import { MouseEventHandler, ReactElement, ReactNode } from 'react'
import { useAuth } from '@hooks/useAuth'
import { useRouter } from 'next/router'

interface AuthEntryProps {
  authenticatedContent: ReactNode
  loginClassName: string
  buttonContentClassName: string
  buttonTextClassName: string
  loginLabel?: string
  onLoginClick?: MouseEventHandler<HTMLButtonElement>
}

export default function AuthEntry({
  authenticatedContent,
  loginClassName,
  buttonContentClassName,
  buttonTextClassName,
  loginLabel = 'Login',
  onLoginClick
}: AuthEntryProps): ReactElement {
  const { isAuthenticated, authEnabled } = useAuth()
  const router = useRouter()

  const path = router.asPath.split('?')[0]
  const isAuthRoute = authEnabled && path.startsWith('/auth/')

  if (!authEnabled) {
    return <>{authenticatedContent}</>
  }

  if (isAuthRoute) {
    return <></>
  }

  if (isAuthenticated) {
    return <>{authenticatedContent}</>
  }

  const content = (
    <span className={buttonContentClassName}>
      <span className={buttonTextClassName}>{loginLabel}</span>
    </span>
  )

  if (onLoginClick) {
    return (
      <button type="button" className={loginClassName} onClick={onLoginClick}>
        {content}
      </button>
    )
  }

  // Fallback when no onLoginClick is provided: go straight to the Authentik
  // login flow (single login entry point) via a full navigation to the API.
  return (
    <a className={loginClassName} href="/api/auth/login">
      {content}
    </a>
  )
}
