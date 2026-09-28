import { ReactElement, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useProfile } from '@context/Profile'
import ProfileCard from './ProfileCard'
import Overview from './Sections/Overview'
import ComputeJobsSection from './Sections/ComputeJobsSection'
import WalletSection from './Sections/Wallet'
import CredentialsSection from './Sections/Credentials'
import SettingsSection from './Sections/Settings'
import PublishedList from './History/PublishedList'
import Downloads from './History/Downloads'
import HistoryData from './History/HistoryData'
import Bookmarks from '../Bookmarks'
import styles from './index.module.css'

// Sections are addressed as /profile?section=<id>. The account menu in the
// header links to these ids, so keep them stable.
type SectionId =
  | 'overview'
  | 'assets'
  | 'downloads'
  | 'compute'
  | 'bookmarks'
  | 'history'
  | 'wallet'
  | 'credentials'
  | 'settings'

interface SectionDef {
  id: SectionId
  label: string
  publicLabel?: string
  icon: string
  description: string
  ownOnly?: boolean
  group: 'activity' | 'account'
}

const SECTIONS: SectionDef[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'dashboard',
    description: 'Your activity on the marketplace at a glance.',
    group: 'activity'
  },
  {
    id: 'assets',
    label: 'My assets',
    publicLabel: 'Published assets',
    icon: 'inventory_2',
    description: 'Data, algorithms and services you have published.',
    group: 'activity'
  },
  {
    id: 'downloads',
    label: 'Downloads',
    icon: 'download',
    description: 'Assets you have bought or downloaded.',
    group: 'activity'
  },
  {
    id: 'compute',
    label: 'Compute jobs',
    icon: 'memory',
    description: 'Compute-to-Data jobs you have started, with their results.',
    ownOnly: true,
    group: 'activity'
  },
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: 'bookmark',
    description: 'Assets you have saved for later.',
    ownOnly: true,
    group: 'activity'
  },
  {
    id: 'history',
    label: 'History',
    icon: 'history',
    description: 'Your on-chain transactions on the marketplace.',
    ownOnly: true,
    group: 'activity'
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: 'account_balance_wallet',
    description: 'Your connected wallet, balances and escrow funds.',
    ownOnly: true,
    group: 'account'
  },
  {
    id: 'credentials',
    label: 'Credentials',
    icon: 'verified_user',
    description:
      'Your digital identities (DIDs) and verifiable credentials, used to access protected assets.',
    ownOnly: true,
    group: 'account'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Your personal details, security and notifications.',
    ownOnly: true,
    group: 'account'
  }
]

export default function AccountPage({
  accountId
}: {
  accountId: string
}): ReactElement {
  const router = useRouter()
  const { ownAccount } = useProfile()

  const visible = SECTIONS.filter((s) => ownAccount || !s.ownOnly)
  const requested = router.query.section as string
  const active = visible.find((s) => s.id === requested) || visible[0]

  const selectSection = useCallback(
    (id: SectionId) => {
      router.replace(
        { pathname: router.pathname, query: { ...router.query, section: id } },
        undefined,
        { shallow: true, scroll: false }
      )
    },
    [router]
  )

  function renderSection(id: SectionId): ReactElement {
    switch (id) {
      case 'assets':
        return <PublishedList accountId={accountId} />
      case 'downloads':
        return <Downloads accountId={accountId} />
      case 'compute':
        return <ComputeJobsSection />
      case 'bookmarks':
        return <Bookmarks />
      case 'history':
        return <HistoryData accountId={accountId} />
      case 'wallet':
        return <WalletSection />
      case 'credentials':
        return <CredentialsSection />
      case 'settings':
        return <SettingsSection />
      default:
        return <Overview onNavigate={selectSection} />
    }
  }

  const groups: { key: SectionDef['group']; title: string }[] = [
    { key: 'activity', title: 'Activity' },
    { key: 'account', title: 'Account' }
  ]

  return (
    <div className={styles.page}>
      <ProfileCard accountId={accountId} />
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Profile sections">
          {groups.map((group) => {
            const items = visible.filter((s) => s.group === group.key)
            if (items.length === 0) return null
            return (
              <div key={group.key} className={styles.navGroup}>
                <span className={styles.navGroupTitle}>{group.title}</span>
                {items.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.navItem} ${
                      s.id === active.id ? styles.navItemActive : ''
                    }`}
                    aria-current={s.id === active.id ? 'page' : undefined}
                    onClick={() => selectSection(s.id)}
                  >
                    <span
                      className={`material-symbols-rounded ${styles.navIcon}`}
                      aria-hidden="true"
                    >
                      {s.icon}
                    </span>
                    {ownAccount ? s.label : s.publicLabel || s.label}
                  </button>
                ))}
              </div>
            )
          })}
        </nav>
        <section className={styles.content} aria-labelledby="profile-section">
          <header className={styles.contentHeader}>
            <h2 id="profile-section" className={styles.contentTitle}>
              {ownAccount ? active.label : active.publicLabel || active.label}
            </h2>
            <p className={styles.contentDescription}>{active.description}</p>
          </header>
          {renderSection(active.id)}
        </section>
      </div>
    </div>
  )
}
