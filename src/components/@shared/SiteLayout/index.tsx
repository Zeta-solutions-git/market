import { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Logo from '@shared/atoms/Logo'
import AuthEntry from '../../Header/AuthEntry'
import Networks from '../../Header/UserPreferences/Networks'
import { useAuth } from '@hooks/useAuth'
import { useMarketMetadata } from '@context/MarketMetadata'
import Upload from '@images/publish.svg'
import AccountMenu from './AccountMenu'
import styles from './index.module.css'

const CATALOGUE_HREF = '/search?sort=indexedMetadata.event.block&sortOrder=desc'

// Shared marketing chrome (navbar + footer) used by the homepage and the
// standalone content pages (About us, Projects, The Team, Contact). Keep the
// nav/footer markup here so every page stays in sync — page-specific sections
// (hero, info, etc.) live in the individual page components.

// Primary navbar links. `href` drives Next routing; add a page under
// src/pages/ with the matching slug when you add an entry here.
export const NAV_LINKS = [
  { label: 'About us', href: '/about-us' },
  { label: 'Projects', href: '/projects' },
  { label: 'The Team', href: '/the-team' },
  { label: 'Contact', href: '/contact' }
]

const FOOTER_COLS = [
  {
    heading: 'Company',
    links: [
      { label: 'About us', href: '/about-us' },
      { label: 'The Team', href: '/the-team' },
      { label: 'Projects', href: '/projects' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'FAQ', href: '#' }
    ]
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' }
    ]
  }
]

// Bright-blue boxed "Catalogue" CTA. When logged in it links straight to the
// catalogue; when logged out it kicks off the Authentik login flow (the
// catalogue is gated, and the default post-login destination is the catalogue).
function CatalogueButton(): ReactElement {
  const { isAuthenticated, authEnabled, beginOidcFlow } = useAuth()
  const loggedIn = !authEnabled || isAuthenticated

  const inner = (
    <span className={styles.buttonContent}>
      <span className={styles.buttonText}>Catalogue</span>
    </span>
  )

  if (loggedIn) {
    return (
      <Link href={CATALOGUE_HREF} className={styles.catalogueButton}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={styles.catalogueButton}
      onClick={() => beginOidcFlow('login').catch(() => undefined)}
    >
      {inner}
    </button>
  )
}

// Unboxed "Sign up" text button, shown to the right of Login. Goes straight to
// the Authentik enrollment flow.
function SignupLink(): ReactElement {
  const { beginOidcFlow } = useAuth()
  return (
    <button
      type="button"
      className={styles.signupLink}
      onClick={() => beginOidcFlow('signup').catch(() => undefined)}
    >
      Sign up
    </button>
  )
}

// The functional marketplace controls that replace the marketing nav links on
// the catalogue page (chain switcher, account menu, publish).
function CatalogueControls(): ReactElement {
  const { validatedSupportedChains } = useMarketMetadata()
  const { isAuthenticated, authEnabled, beginOidcFlow } = useAuth()
  const showAuthedControls = !authEnabled || isAuthenticated
  const showAuthButtons = authEnabled && !isAuthenticated

  return (
    <div className={styles.catalogueControls}>
      {validatedSupportedChains.length > 1 && <Networks />}
      {showAuthedControls && <AccountMenu />}
      <Link href="/publish/1" className={styles.catalogueButton}>
        <span className={styles.buttonContent}>
          <Upload className={styles.publishIcon} />
          <span className={styles.buttonText}>Publish</span>
        </span>
      </Link>
      {/* Public catalogue: a logged-out visitor still gets Login / Sign up
          here, since the wallet/SSI controls above are hidden for them. */}
      {showAuthButtons && (
        <>
          <button
            type="button"
            className={styles.pillButton}
            onClick={() => beginOidcFlow('login').catch(() => undefined)}
          >
            <span className={styles.buttonContent}>
              <span className={styles.buttonText}>Login</span>
            </span>
          </button>
          <SignupLink />
        </>
      )}
    </div>
  )
}

function Nav(): ReactElement {
  const { beginOidcFlow, isAuthenticated, authEnabled } = useAuth()
  const router = useRouter()
  // On the catalogue page we swap the marketing links for the functional
  // marketplace controls.
  const isCatalogue = router.pathname === '/search'
  const showAuthButtons = authEnabled && !isAuthenticated

  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <Link
          href="/"
          className={styles.navLogo}
          aria-label="OpenDataSpace home"
        >
          <Logo />
        </Link>
        {/* centered links (absolutely centered in the bar) — hidden on the
            catalogue, where functional controls take their place */}
        {!isCatalogue && (
          <nav className={styles.navLinks} aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className={styles.navActions}>
          {isCatalogue ? (
            <CatalogueControls />
          ) : (
            <>
              {/* Order: [Catalogue] [Login] [Sign up]. Login goes straight to
                  the Authentik login flow (via /api/auth/login); Sign up goes
                  to the Authentik enrollment flow. */}
              <CatalogueButton />
              <AuthEntry
                authenticatedContent={<AccountMenu />}
                loginClassName={styles.pillButton}
                buttonContentClassName={styles.buttonContent}
                buttonTextClassName={styles.buttonText}
                onLoginClick={() => {
                  beginOidcFlow('login').catch(() => undefined)
                }}
              />
              {showAuthButtons && <SignupLink />}
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function SiteFooter(): ReactElement {
  return (
    <footer className={styles.footer} aria-label="Footer">
      <div className={styles.footerInner}>
        <div className={styles.footerCols}>
          {FOOTER_COLS.map((col) => (
            <div key={col.heading} className={styles.footerCol}>
              <h4 className={styles.footerHeading}>{col.heading}</h4>
              <ul className={styles.footerList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className={styles.footerLink}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerGroup}>
            <Link
              href="/"
              className={styles.footerLogo}
              aria-label="OpenDataSpace home"
            >
              <Logo />
            </Link>
            <span className={styles.footerCopy}>
              © 2026 OpenDataSpace. All rights reserved.
            </span>
          </div>
          <div className={styles.footerGroup}>
            <img
              src="/images/pzh-logo.png"
              alt="Provincie Zuid-Holland"
              className={styles.fundingLogo}
            />
            <span className={styles.footerCopy}>
              Co-financed by Provincie Zuid-Holland
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Wraps page content between the shared navbar and footer. The `.landing`
// wrapper also carries the --secondary accent variable used by page sections.
export default function SiteLayout({
  children
}: {
  children: ReactNode
}): ReactElement {
  return (
    <div className={styles.landing}>
      <Nav />
      {children}
      <SiteFooter />
    </div>
  )
}
