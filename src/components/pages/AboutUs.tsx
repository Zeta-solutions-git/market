import { ReactElement } from 'react'
import styles from '@shared/SiteLayout/content.module.css'

export default function AboutUs(): ReactElement {
  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.banner} ${styles.bannerWhite} ${styles.bannerCenter}`}
        aria-label="About us"
      >
        <div className={styles.bannerInner}>
          <h1 className={styles.bannerTitle}>About us</h1>
          <p className={styles.bannerLead}>
            A sovereign marketplace for data and AI, built on Gaia-X principles.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.comingSoon}>
            <span
              className={`material-symbols-rounded ${styles.comingSoonIcon}`}
              aria-hidden="true"
            >
              schedule
            </span>
            <h2 className={styles.comingSoonTitle}>Coming soon</h2>
            <p className={styles.comingSoonText}>
              We&apos;re putting this page together. Check back soon to learn
              more about who we are and what we stand for.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
