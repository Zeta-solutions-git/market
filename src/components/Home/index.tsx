import { ReactElement } from 'react'
import Link from 'next/link'
import Logo from '@shared/atoms/Logo'
import UserPreferences from '../Header/UserPreferences'
import AuthEntry from '../Header/AuthEntry'
import { useAuth } from '@hooks/useAuth'
import styles from './index.module.css'

// Stripped-down OpenDataSpace landing page.
// Sections: Nav (logo + links + search + login) · Hero · Info · Footer.
// New structural bits (search, stats, image collage) are placeholders.

const NAV_LINKS = ['About us', 'Projects', 'The Team', 'Contact']

const FOOTER_COLS = [
  {
    heading: 'Company',
    links: ['About us', 'The Team', 'Projects', 'Contact']
  },
  { heading: 'Resources', links: ['Documentation', 'Support', 'FAQ'] },
  { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service'] }
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
  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <div className={styles.navLeft}>
          <Link
            href="/"
            className={styles.navLogo}
            aria-label="OpenDataSpace home"
          >
            <Logo />
          </Link>
          <nav className={styles.navLinks} aria-label="Primary">
            {NAV_LINKS.map((label) => (
              <a key={label} href="#" className={styles.navLink}>
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className={styles.navActions}>
          {/* Settings (⚙) — kept from before */}
          <UserPreferences />
          {/* pill-shaped button = Login (Logout when authenticated) */}
          <AuthEntry
            authenticatedContent={<LogoutButton />}
            loginClassName={styles.pillButton}
            buttonContentClassName={styles.buttonContent}
            buttonTextClassName={styles.buttonText}
          />
        </div>
      </div>
    </header>
  )
}

function Hero(): ReactElement {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroInner}>
        {/* LEFT COLUMN — text */}
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Making data more accessible</h1>
          <p className={styles.heroSubtitle}>
            Smaller supporting text placeholder in grey — a sentence or two
            introducing OpenDataSpace goes here.
          </p>
          <div className={styles.stats}>
            <span className={styles.statNumber}>123</span>
            <span className={styles.statDivider} aria-hidden="true" />
            <span className={styles.statLabel}>Stat label placeholder</span>
          </div>
          <button type="button" className={styles.discoverButton}>
            Discover more
          </button>
        </div>

        {/* RIGHT COLUMN — image collage (placeholders, <img>-ready) */}
        <div className={styles.heroCollage}>
          <div className={styles.collageStack}>
            <div className={styles.collageImg16} aria-hidden="true">
              <span>Image</span>
            </div>
            <div className={styles.collageImg16} aria-hidden="true">
              <span>Image</span>
            </div>
          </div>
          <div className={styles.collagePortrait} aria-hidden="true">
            <span>Image</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoSection(): ReactElement {
  return (
    <section className={styles.info} aria-label="Info section">
      <div className={styles.sectionInner}>
        <span className={styles.placeholderTag}>Info section</span>
        <p className={styles.placeholderBody}>
          Info section placeholder — feature highlights, value propositions or
          content blocks go here.
        </p>
      </div>
    </section>
  )
}

function SiteFooter(): ReactElement {
  return (
    <footer className={styles.footer} aria-label="Footer">
      <div className={styles.footerInner}>
        <div className={styles.footerMain}>
          <Link
            href="/"
            className={styles.footerLogo}
            aria-label="OpenDataSpace home"
          >
            <Logo />
          </Link>
          <div className={styles.footerCols}>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading} className={styles.footerCol}>
                <h4 className={styles.footerHeading}>{col.heading}</h4>
                <ul className={styles.footerList}>
                  {col.links.map((label) => (
                    <li key={label}>
                      <a href="#" className={styles.footerLink}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>
            © 2026 OpenDataSpace. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage(): ReactElement {
  return (
    <div className={styles.landing}>
      <Nav />
      <Hero />
      <InfoSection />
      <SiteFooter />
    </div>
  )
}
