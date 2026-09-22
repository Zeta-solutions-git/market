import { ReactElement } from 'react'
import styles from '@shared/SiteLayout/content.module.css'

export default function Projects(): ReactElement {
  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.banner} ${styles.bannerWhite} ${styles.bannerCenter}`}
        aria-label="Projects"
      >
        <div className={styles.bannerInner}>
          <h1 className={styles.bannerTitle}>Projects</h1>
          <p className={styles.bannerLead}>
            Cross-sector dataspaces we are building with public and private
            partners.
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
              We&apos;re putting this page together. Check back soon to see the
              projects we&apos;re working on.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
