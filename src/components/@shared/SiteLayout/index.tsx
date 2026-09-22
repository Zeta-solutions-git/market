import { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import Logo from '@shared/atoms/Logo'
import AuthEntry from '../../Header/AuthEntry'
import { useAuth } from '@hooks/useAuth'
import styles from './index.module.css'

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

function LogoutButton(): ReactElement {
  const { logout } = useAuth()
  return (
    <button
      type="button"
      className={styles.pillButton}
      onClick={() => logout()}
    >
      <span className={styles.buttonContent}>
        <span className={styles.buttonText}>Logout</span>
      </span>
    </button>
  )
}

function Nav(): ReactElement {
  const { beginOidcFlow } = useAuth()
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
        {/* centered links (absolutely centered in the bar) */}
        <nav className={styles.navLinks} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className={styles.navActions}>
          {/* Login goes straight to the Authentik login flow (via
              /api/auth/login) instead of the intermediate market /auth/login
              page. Signup lives on the Authentik login page as a "sign up"
              link (Authentik identification-stage enrollment flow). */}
          <AuthEntry
            authenticatedContent={<LogoutButton />}
            loginClassName={styles.pillButton}
            buttonContentClassName={styles.buttonContent}
            buttonTextClassName={styles.buttonText}
            onLoginClick={() => {
              beginOidcFlow('login').catch(() => undefined)
            }}
          />
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
