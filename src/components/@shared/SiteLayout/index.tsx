import { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Logo from '@shared/atoms/Logo'
import AuthEntry from '../../Header/AuthEntry'
import Networks from '../../Header/UserPreferences/Networks'
import { useAuth } from '@hooks/useAuth'
import { useMarketMetadata } from '@context/MarketMetadata'
import AccountMenu from './AccountMenu'
import styles from './index.module.css'

export const CATALOGUE_HREF =
  '/search?sort=indexedMetadata.event.block&sortOrder=desc'

// Marketing/content pages get the nav links; every other route is a
// marketplace page (catalogue, asset, publish, profile, …) with app controls.
const MARKETING_ROUTES = [
  '/',
  '/about-us',
  '/projects',
  '/the-team',
  '/contact',
  '/[slug]',
  '/privacy/[slug]',
  '/404',
  '/signup/submitted'
]

// Shared marketing chrome (navbar + footer) used by the homepage and the
// standalone content pages (About us, Projects, The Team, Contact). Keep the
// nav/footer markup here so every page stays in sync — page-specific sections
// (hero, info, etc.) live in the individual page components.

// Primary navbar links. `href` drives Next routing; add a page under
// src/pages/ with the matching slug when you add an entry here.
export const NAV_LINKS = [
  { label: 'Catalogue', href: CATALOGUE_HREF },
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
export function CatalogueButton({
  className,
  label = 'Catalogue'
}: {
  className?: string
  label?: string
}): ReactElement {
  const { isAuthenticated, authEnabled, beginOidcFlow } = useAuth()
  const loggedIn = !authEnabled || isAuthenticated

  const inner = (
    <span className={styles.buttonContent}>
      <span className={styles.buttonText}>{label}</span>
    </span>
  )

  if (loggedIn) {
    return (
      <Link
        href={CATALOGUE_HREF}
        className={className || styles.catalogueButton}
      >
        {inner}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={className || styles.catalogueButton}
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

// Marketplace pages: no marketing links. [Networks] [Catalogue] then the
// account: Login + Sign up, or the profile dropdown, which is always last.
function AppControls({ onCatalogue }: { onCatalogue: boolean }): ReactElement {
  const { validatedSupportedChains } = useMarketMetadata()
  const { isAuthenticated, authEnabled, beginOidcFlow } = useAuth()
  const showAccount = !authEnabled || isAuthenticated

  return (
    <div className={styles.catalogueControls}>
      {validatedSupportedChains.length > 1 && <Networks />}
      {!onCatalogue && (
        <Link href={CATALOGUE_HREF} className={styles.catalogueButton}>
          <span className={styles.buttonContent}>
            <span className={styles.buttonText}>Catalogue</span>
          </span>
        </Link>
      )}
      {showAccount ? (
        <AccountMenu />
      ) : (
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
  const isMarketing = MARKETING_ROUTES.includes(router.pathname)
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
        {/* centered links (absolutely centered in the bar) — marketing pages
            only; marketplace pages get the app controls instead */}
        {isMarketing && (
          <nav className={styles.navLinks} aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        <div className={styles.navActions}>
          {!isMarketing ? (
            <AppControls onCatalogue={router.pathname === '/search'} />
          ) : (
            <>
              {/* Order: [Login] [Sign up] or the profile dropdown. Catalogue
                  is one of the nav links here. Login goes straight to the
                  Authentik login flow; Sign up to the enrollment flow. */}
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
