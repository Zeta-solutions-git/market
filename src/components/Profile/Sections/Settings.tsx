import { ReactElement } from 'react'
import Link from 'next/link'
import { useAuth } from '@hooks/useAuth'
import styles from './Sections.module.css'

function Soon(): ReactElement {
  return <span className={styles.soon}>Coming soon</span>
}

function Value({ value }: { value?: string }): ReactElement {
  return value ? <>{value}</> : <span className={styles.muted}>—</span>
}

// Personal details come from the login token (Authentik oe-profile scope).
// Editing, security and notification controls are placeholders for now:
// participants are "external" Authentik users and can't use Authentik's own
// account pages, so these need dedicated flows first.
export default function SettingsSection(): ReactElement {
  const { user } = useAuth()

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Personal information</h3>
          <button type="button" className={styles.buttonSecondary} disabled>
            Edit details
          </button>
        </div>
        <dl className={styles.fields}>
          <dt>First name</dt>
          <dd>
            <Value value={user?.firstName} />
          </dd>
          <dt>Last name</dt>
          <dd>
            <Value value={user?.lastName} />
          </dd>
          {!user?.firstName && !user?.lastName && (
            <>
              <dt>Full name</dt>
              <dd>
                <Value value={user?.name} />
              </dd>
            </>
          )}
          <dt>Company</dt>
          <dd>
            <Value value={user?.company} />
          </dd>
          <dt>Email</dt>
          <dd>
            <Value value={user?.email} />
          </dd>
          <dt>Username</dt>
          <dd>
            <Value value={user?.username} />
          </dd>
        </dl>
        <p className={styles.cardText} style={{ marginTop: 14 }}>
          Editing your details yourself is coming soon. Until then,{' '}
          <Link href="/contact">contact the ODL team</Link> for changes.
        </p>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Security
        </h3>
        <div className={styles.rows}>
          <div className={styles.row}>
            <span>
              <span className={styles.rowTitle}>
                Password <Soon />
              </span>
              <span className={styles.rowText}>
                Change the password you use to log in.
              </span>
            </span>
            <button type="button" className={styles.buttonSecondary} disabled>
              Change password
            </button>
          </div>
          <div className={styles.row}>
            <span>
              <span className={styles.rowTitle}>
                Two-factor authentication <Soon />
              </span>
              <span className={styles.rowText}>
                Add a second step, like an authenticator app, when you log in.
              </span>
            </span>
            <button type="button" className={styles.buttonSecondary} disabled>
              Set up
            </button>
          </div>
          <div className={styles.row}>
            <span>
              <span className={styles.rowTitle}>
                Active sessions <Soon />
              </span>
              <span className={styles.rowText}>
                See where you are logged in and log out other devices.
              </span>
            </span>
            <button type="button" className={styles.buttonSecondary} disabled>
              View sessions
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle} style={{ marginBottom: 12 }}>
          Email notifications <Soon />
        </h3>
        <div className={styles.rows}>
          {[
            ['Account updates', 'Approval and important account changes.'],
            ['Sales', 'When someone buys or downloads your asset.'],
            ['Compute jobs', 'When a compute job you started has finished.']
          ].map(([title, text]) => (
            <label key={title} className={styles.row}>
              <span>
                <span className={styles.rowTitle}>{title}</span>
                <span className={styles.rowText}>{text}</span>
              </span>
              <input type="checkbox" defaultChecked disabled />
            </label>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>
            <span className={styles.rowTitle}>Delete account</span>
            <span className={styles.rowText}>
              Permanently remove your account. Contact the ODL team and we’ll
              handle your request.
            </span>
          </span>
          <Link href="/contact" className={styles.buttonDanger}>
            Request deletion
          </Link>
        </div>
      </div>
    </div>
  )
}
