import { ReactElement, useEffect, useState } from 'react'
import { LoggerInstance } from '@oceanprotocol/lib'
import Copy from '@shared/atoms/Copy'
import { useSsiWallet } from '@context/SsiWallet'
import useSsiConnect from '@hooks/useSsiConnect'
import {
  getSsiVerifiableCredentialType,
  getWalletCredentials,
  getWalletDids
} from '@utils/wallet/ssiWallet'
import { getRuntimeConfig } from '@utils/runtimeConfig'
import { SsiVerifiableCredential, SsiWalletDid } from 'src/@types/SsiWallet'
import styles from './Sections.module.css'

function issuerOf(credential: SsiVerifiableCredential): string {
  const issuer = credential?.parsedDocument?.issuer as unknown
  if (!issuer) return 'Unknown issuer'
  if (typeof issuer === 'string') return issuer
  const obj = issuer as { name?: string; id?: string }
  return obj.name || obj.id || 'Unknown issuer'
}

function dateOf(value?: unknown): string {
  if (!value) return ''
  const date = new Date(value as string)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
}

function shorten(value: string, keep = 18): string {
  return value.length > keep * 2 + 3
    ? `${value.slice(0, keep)}…${value.slice(-8)}`
    : value
}

export default function CredentialsSection(): ReactElement {
  const {
    sessionToken,
    selectedWallet,
    isSsiStateHydrated,
    isSsiSessionHydrating
  } = useSsiWallet()
  const { connectSsi } = useSsiConnect()
  const [dids, setDids] = useState<SsiWalletDid[]>([])
  const [credentials, setCredentials] = useState<SsiVerifiableCredential[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ssiUiUrl = getRuntimeConfig().NEXT_PUBLIC_SSI_UI_URL

  useEffect(() => {
    if (!sessionToken?.token || !selectedWallet?.id) return
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      getWalletDids(selectedWallet.id, sessionToken.token),
      getWalletCredentials(selectedWallet.id, sessionToken.token)
    ])
      .then(([didList, credentialList]) => {
        if (cancelled) return
        setDids(didList || [])
        setCredentials(credentialList || [])
      })
      .catch((e) => {
        LoggerInstance.error('Loading SSI wallet contents failed', e)
        if (!cancelled) setError('Could not load your credentials wallet.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sessionToken?.token, selectedWallet?.id])

  const connected = Boolean(sessionToken)

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Credentials wallet</h3>
          <span className={styles.status}>
            <span
              className={`${styles.dot} ${connected ? styles.dotOn : ''}`}
            />
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        {!connected ? (
          <div className={styles.row}>
            <span className={styles.rowText}>
              Connect your credentials wallet to see your digital identities and
              credentials.
            </span>
            <button
              type="button"
              className={styles.button}
              onClick={() => connectSsi()}
              disabled={!isSsiStateHydrated || isSsiSessionHydrating}
            >
              {isSsiSessionHydrating ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        ) : (
          <p className={styles.cardText}>
            Protected assets check these credentials before you can access them.
            {ssiUiUrl && (
              <>
                {' '}
                <a href={ssiUiUrl} target="_blank" rel="noopener noreferrer">
                  Open the full credentials wallet
                </a>
                .
              </>
            )}
          </p>
        )}
      </div>

      {connected && (
        <>
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: 12 }}>
              Digital identities (DIDs)
            </h3>
            {loading ? (
              <p className={styles.cardText}>Loading…</p>
            ) : dids.length === 0 ? (
              <p className={styles.cardText}>No identities yet.</p>
            ) : (
              <ul className={styles.list}>
                {dids.map((d) => (
                  <li key={d.did} className={styles.listItem}>
                    <span
                      className={`material-symbols-rounded ${styles.listIcon}`}
                      aria-hidden="true"
                    >
                      fingerprint
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className={styles.rowTitle}>
                        {d.alias || 'Identity'}
                      </span>
                      <span className={`${styles.rowText} ${styles.mono}`}>
                        {shorten(d.did)} <Copy text={d.did} />
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ marginBottom: 12 }}>
              Verifiable credentials
            </h3>
            {error ? (
              <p className={styles.cardText}>{error}</p>
            ) : loading ? (
              <p className={styles.cardText}>Loading…</p>
            ) : credentials.length === 0 ? (
              <p className={styles.cardText}>No credentials yet.</p>
            ) : (
              <ul className={styles.list}>
                {credentials.map((c) => {
                  const doc = c.parsedDocument as unknown as Record<
                    string,
                    unknown
                  >
                  const issued = dateOf(doc?.issuanceDate || doc?.validFrom)
                  const expires = dateOf(doc?.expirationDate || doc?.validUntil)
                  return (
                    <li key={c.id} className={styles.listItem}>
                      <span
                        className={`material-symbols-rounded ${styles.listIcon}`}
                        aria-hidden="true"
                      >
                        badge
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className={styles.rowTitle}>
                          {getSsiVerifiableCredentialType(c)}
                        </span>
                        <span className={styles.rowText}>
                          Issued by {shorten(issuerOf(c))}
                          {issued && ` · ${issued}`}
                          {expires && ` · expires ${expires}`}
                        </span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}
