import { ReactElement } from 'react'
import Marquee from 'react-fast-marquee'
import styles from './index.module.css'

// OpenDataSpace landing page. Navbar + footer come from the shared SiteLayout;
// this file owns the homepage-only sections: Hero · Logo strip · Info.
// New structural bits (search, stats, image collage) are placeholders.

// Partner/ecosystem logos shown in the sliding strip between hero and info.
// To add a logo: drop the image file in public/images/partners/ (or
// public/images/extra-logos/) and add an { src, alt } entry to this array.
const PARTNER_LOGOS = [
  { src: '/images/partners/1-MIWM_logo.png', alt: 'MIWM' },
  { src: '/images/partners/2-fides-logo.png', alt: 'Fides' },
  {
    src: '/images/partners/3-gaia-x-netherlands.png',
    alt: 'Gaia-X Netherlands'
  },
  {
    src: '/images/partners/4-deltaDAO_Logo_small_RGB_positiv.png',
    alt: 'deltaDAO'
  },
  { src: '/images/extra-logos/1-ESRI_logo.png', alt: 'ESRI' },
  { src: '/images/extra-logos/2-TNO_logo.png', alt: 'TNO' },
  {
    src: '/images/extra-logos/3-FutureMobilityNetwork_logo.png',
    alt: 'Future Mobility Network'
  },
  { src: '/images/extra-logos/4-Sphereon_logo.png', alt: 'Sphereon' },
  {
    src: '/images/extra-logos/5-Logo_TopsectorICT_RGB.png',
    alt: 'Topsector ICT'
  },
  { src: '/images/extra-logos/6-CFNS_logo.png', alt: 'CFNS' },
  { src: '/images/extra-logos/7-LVVN_NVWA_logo.png', alt: 'LVVN / NVWA' },
  { src: '/images/extra-logos/8-pontusx_logo_horizontal.png', alt: 'Pontus-X' },
  { src: '/images/extra-logos/9-logo-coe-dsc.png', alt: 'CoE-DSC' }
]

// Info-section feature grid (3 across × 2 down). `icon` = Material Symbols name.
const INFO_FEATURES = [
  {
    icon: 'shield',
    title: 'Digital sovereignty',
    body: 'Data owners retain full control.'
  },
  {
    icon: 'source',
    title: 'Preventing copies of data',
    body: 'Data stays at the source.'
  },
  {
    icon: 'hub',
    title: 'DAO',
    body: 'Self-organized governance for transparency and scalability.'
  },
  {
    icon: 'sync_alt',
    title: 'Bridging supply and demand',
    body: 'Connecting data and AI algorithms.'
  },
  {
    icon: 'share',
    title: 'Flexible sharing',
    body: 'Options for both open and restricted data.'
  },
  {
    icon: 'workspace_premium',
    title: 'Labels',
    body: '“Digital quality stamps” for datasets and algorithms.'
  }
]

function Hero(): ReactElement {
  return (
    <section className={styles.hero} aria-label="Hero">
      <div className={styles.heroInner}>
        {/* LEFT COLUMN — text */}
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>Making data more accessible</h1>
          <p className={styles.heroSubtitle}>
            Discover, develop, and share datasets and AI algorithms within an
            innovative ecosystem. Experience and leverage decentralized
            technologies and the European Gaia-X data-sharing concepts. We
            facilitate public-private, cross-sector, and cross-border
            collaboration while ensuring digital sovereignty.
          </p>
          <div className={styles.stats}>
            {/* TODO: replace the hardcoded 18 with the real, up-to-date count
                of assets in the catalogue (fetch from the node query API). */}
            <span className={styles.statNumber}>18</span>
            <span className={styles.statDivider} aria-hidden="true" />
            <span className={styles.statLabel}>
              Products available in the catalogue
            </span>
          </div>
          <button type="button" className={styles.discoverButton}>
            Discover more
          </button>
        </div>

        {/* RIGHT COLUMN — image collage */}
        <div className={styles.heroCollage}>
          <div className={styles.collageStack}>
            <div className={styles.collageImg16}>
              <img src="/images/hero/drone.jpg" alt="Aerial drone view" />
            </div>
            <div className={styles.collageImg16}>
              <img src="/images/hero/road.jpg" alt="Road infrastructure" />
            </div>
          </div>
          <div className={styles.collagePortrait}>
            <img
              src="/images/hero/sat.jpg"
              alt="Satellite ground station at sunset"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoStrip(): ReactElement {
  return (
    <section className={styles.logoStrip} aria-label="Partners and ecosystem">
      <Marquee autoFill speed={40} pauseOnHover gradient={false}>
        {PARTNER_LOGOS.map((logo) => (
          <img
            key={logo.src}
            src={logo.src}
            alt={logo.alt}
            className={styles.logoItem}
          />
        ))}
      </Marquee>
    </section>
  )
}

function InfoSection(): ReactElement {
  return (
    <section className={styles.info} aria-label="Info section">
      <div className={styles.sectionInner}>
        <div className={styles.infoLayout}>
          {/* LEFT COLUMN — text */}
          <div className={styles.infoText}>
            <h2 className={styles.infoTitle}>
              A sovereign marketplace for data and AI
            </h2>
            <div className={styles.infoIntro}>
              <p>
                Open Dataspace Lab connects supply and demand for all types of
                data and AI algorithms, enabling secure, privacy-friendly, and
                compliant data exchange. It empowers data providers, consumers,
                and developers—such as businesses, researchers, and public
                organizations—to share, collaborate, and commercialize their
                data services while maintaining full control over their data.
              </p>
              <p>
                Built on Gaia-X principles, the marketplace ensures digital
                sovereignty, security, and compliance through state-of-the-art
                technologies like blockchain and AI. Data remains at the source,
                preventing unnecessary copies while allowing both open and
                restricted sharing models.
              </p>
            </div>
            <p className={styles.infoOutro}>
              By fostering a decentralized and future-proof data ecosystem, Open
              Dataspace Lab enables organizations to unlock the true value of
              data while ensuring transparency, security, and sustainability.
            </p>
          </div>

          {/* RIGHT COLUMN — feature cards stacked vertically */}
          <div className={styles.featureList}>
            {INFO_FEATURES.map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <span
                  className={`material-symbols-rounded ${styles.featureIcon}`}
                  aria-hidden="true"
                >
                  {feature.icon}
                </span>
                <div className={styles.featureCopy}>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureBody}>{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage(): ReactElement {
  return (
    <>
      <Hero />
      <LogoStrip />
      <InfoSection />
    </>
  )
}
