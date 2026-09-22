import { ReactElement } from 'react'
import styles from '@shared/SiteLayout/content.module.css'

export default function Contact(): ReactElement {
  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.banner} ${styles.bannerWhite} ${styles.bannerCenter} ${styles.contactBanner}`}
        aria-label="Contact"
      >
        <div className={styles.bannerInner}>
          <h1 className={styles.bannerTitle}>Get in touch</h1>
          <p className={styles.bannerLead}>
            Interested in joining the dataspace, sharing a dataset, or exploring
            a use case together? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          {/* Static form for now — wire up to a handler/endpoint later. */}
          <form
            className={`${styles.form} ${styles.contactForm}`}
            onSubmit={(e) => e.preventDefault()}
            aria-label="Contact form"
          >
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="contact-first-name"
                >
                  First name
                </label>
                <input
                  id="contact-first-name"
                  name="firstName"
                  type="text"
                  className={styles.input}
                  placeholder="First name"
                />
              </div>
              <div className={styles.field}>
                <label
                  className={styles.fieldLabel}
                  htmlFor="contact-last-name"
                >
                  Last name
                </label>
                <input
                  id="contact-last-name"
                  name="lastName"
                  type="text"
                  className={styles.input}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-company">
                Company name
              </label>
              <input
                id="contact-company"
                name="company"
                type="text"
                className={styles.input}
                placeholder="Company name"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-email">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="you@organization.com"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="contact-message">
                Message
              </label>
              <textarea
                id="contact-message"
                name="message"
                className={styles.textarea}
                placeholder="How can we help?"
              />
            </div>
            <button type="submit" className={styles.submit}>
              Send message
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
