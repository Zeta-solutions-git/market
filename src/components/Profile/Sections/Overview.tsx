import { ReactElement, useState } from 'react'
import Link from 'next/link'
import { useProfile } from '@context/Profile'
import Stats from '../Header/Stats'
import TokenSelector from '../Header/TokenSelector'
import styles from './Sections.module.css'

type NavigateFn = (
  section: 'assets' | 'compute' | 'wallet' | 'credentials'
) => void

export default function Overview({
  onNavigate
}: {
  onNavigate: NavigateFn
}): ReactElement {
  const { ownAccount } = useProfile()
  const [selectedToken, setSelectedToken] = useState<string>('')

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Activity</h3>
          <TokenSelector
            selectedToken={selectedToken}
            onTokenChange={setSelectedToken}
          />
        </div>
        <Stats selectedToken={selectedToken} variant="activity" />
      </div>

      {ownAccount && (
        <div>
          <h3 className={styles.cardTitle}>Quick actions</h3>
          <div className={styles.tiles} style={{ marginTop: 12 }}>
            <Link href="/publish/1" className={styles.tile}>
              <span
                className={`material-symbols-rounded ${styles.tileIcon}`}
                aria-hidden="true"
              >
                upload
              </span>
              <span className={styles.tileTitle}>Publish an asset</span>
              <span className={styles.tileText}>
                Offer a dataset, algorithm or service.
              </span>
            </Link>
            <Link
              href="/search?sort=indexedMetadata.event.block&sortOrder=desc"
              className={styles.tile}
            >
              <span
                className={`material-symbols-rounded ${styles.tileIcon}`}
                aria-hidden="true"
              >
                travel_explore
              </span>
              <span className={styles.tileTitle}>Browse the catalogue</span>
              <span className={styles.tileText}>
                Find data and services to use.
              </span>
            </Link>
            <button
              type="button"
              className={styles.tile}
              onClick={() => onNavigate('compute')}
            >
              <span
                className={`material-symbols-rounded ${styles.tileIcon}`}
                aria-hidden="true"
              >
                memory
              </span>
              <span className={styles.tileTitle}>Compute jobs</span>
              <span className={styles.tileText}>
                Check running jobs and download results.
              </span>
            </button>
            <button
              type="button"
              className={styles.tile}
              onClick={() => onNavigate('wallet')}
            >
              <span
                className={`material-symbols-rounded ${styles.tileIcon}`}
                aria-hidden="true"
              >
                account_balance_wallet
              </span>
              <span className={styles.tileTitle}>Wallet &amp; escrow</span>
              <span className={styles.tileText}>
                Balances, escrow funds and withdrawals.
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
