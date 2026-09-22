import { ReactElement } from 'react'
import styles from '@shared/SiteLayout/content.module.css'

// LinkedIn glyph (Material Symbols has no brand icons, so inline the mark).
function LinkedInIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14zM8.34 9.5H5.67V18h2.67V9.5zM7 5.75a1.55 1.55 0 1 0 0 3.11 1.55 1.55 0 0 0 0-3.11zM18.33 18v-4.67c0-2.49-1.33-3.65-3.11-3.65-1.44 0-2.08.79-2.44 1.35V9.5h-2.67V18h2.67v-4.34c0-.23.02-.46.09-.62.18-.45.6-.92 1.3-.92.92 0 1.29.7 1.29 1.72V18h2.9z" />
    </svg>
  )
}

interface Member {
  name: string
  role: string
  photo: string
  linkedin: string
  email?: string
  // true = lift brightness for a darker source photo (see .memberPhotoLight)
  light?: boolean
}

// Photos live in public/images/team/ and are rendered black & white (see the
// grayscale filter on .memberPhoto img). Add LinkedIn URLs when confirmed.
const MEMBERS: Member[] = [
  {
    name: 'Rob Broekman',
    role: 'Lead Remote Sensing Data, NVWA InnovatieLab',
    photo: '/images/team/rob.jpg',
    light: true,
    linkedin: '#',
    email: 'r.j.j.a.broekman@nvwa.nl'
  },
  {
    name: 'Joris Krüse',
    role: 'AIC4NL',
    photo: '/images/team/joris.jpg',
    linkedin: '#',
    email: 'joris.kruse@groundstation.space'
  },
  {
    name: 'Friso van der Burg',
    role: 'Technical Product Owner at ODL',
    photo: '/images/team/friso.jpg',
    linkedin: '#',
    email: 'friso.van.der.burg@groundstation.space'
  },
  {
    name: 'Willem Morsink',
    role: 'Data Space Engineer at ODL',
    photo: '/images/team/willem.jpg',
    linkedin: '#',
    email: 'willem.morsink@groundstation.space'
  },
  {
    name: 'Martijn Seijger',
    role: 'Groundstation.Space',
    photo: '/images/team/martijn.jpg',
    linkedin: '#',
    email: 'martijn.seijger@groundstation.space'
  },
  {
    name: 'Arthur Maring',
    role: 'Innovator, Rijkswaterstaat',
    photo: '/images/team/arthur.png',
    light: true,
    linkedin: '#',
    email: 'arthur.maring@rws.nl'
  }
]

export default function TheTeam(): ReactElement {
  return (
    <div className={styles.wrap}>
      <section
        className={`${styles.banner} ${styles.bannerWhite} ${styles.bannerCenter}`}
        aria-label="The team"
      >
        <div className={styles.bannerInner}>
          <h1 className={styles.bannerTitle}>Our team</h1>
          <p className={styles.bannerLead}>
            A multidisciplinary team of engineers, data architects, and domain
            experts committed to sovereign, trustworthy data sharing.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.sectionInner}>
          <div className={styles.teamGrid}>
            {MEMBERS.map((member, i) => (
              <div key={i} className={styles.memberCard}>
                <div className={styles.memberInner}>
                  <div
                    className={`${styles.memberPhoto} ${
                      member.light ? styles.memberPhotoLight : ''
                    }`}
                  >
                    <img src={member.photo} alt={member.name} />
                  </div>
                  <div className={styles.memberBody}>
                    <div className={styles.memberInfo}>
                      <h2 className={styles.memberName}>{member.name}</h2>
                      <p className={styles.memberRole}>{member.role}</p>
                    </div>
                    <div className={styles.memberSocials}>
                      <a
                        href={member.linkedin}
                        className={styles.memberSocial}
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <LinkedInIcon />
                      </a>
                      <a
                        href={member.email ? `mailto:${member.email}` : '#'}
                        className={styles.memberSocial}
                        aria-label={`Email ${member.name}`}
                      >
                        <span className="material-symbols-rounded">mail</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
