import { ReactElement, useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import Copy from '@shared/atoms/Copy'
import NetworkName from '@shared/NetworkName'
import ExplorerLink from '@shared/ExplorerLink'
import { accountTruncate } from '@utils/wallet'
import Stats from '../Header/Stats'
import TokenSelector from '../Header/TokenSelector'
import AddTokenList from '../../Header/Wallet/AddTokenList'
import styles from './Sections.module.css'

// Wallet details, balances + escrow, and wallet actions. These moved here from
// the old header wallet dropdown.
export default function WalletSection(): ReactElement {
  const { address, connector, chainId, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [selectedToken, setSelectedToken] = useState<string>('')
  const isMetaMask = connector?.name === 'MetaMask'

  return (
    <div className={styles.stack}>
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Connected wallet</h3>
          <span className={styles.status}>
            <span
              className={`${styles.dot} ${isConnected ? styles.dotOn : ''}`}
            />
            {isConnected ? 'Connected' : 'Not connected'}
          </span>
        </div>
        <dl className={styles.fields}>
          <dt>Wallet type</dt>
          <dd>
            {connector?.name === 'Signer Server'
              ? 'Managed wallet (Signer Server)'
              : connector?.name || '—'}
          </dd>
          <dt>Network</dt>
          <dd>{chainId ? <NetworkName networkId={chainId} /> : '—'}</dd>
          <dt>Address</dt>
          <dd>
            {address ? (
              <>
                <span className={styles.mono} title={address}>
                  {accountTruncate(address)}
                </span>
                <Copy text={address} />
              </>
            ) : (
              '—'
            )}
          </dd>
          {address && chainId && (
            <>
              <dt>Explorer</dt>
              <dd>
                <ExplorerLink networkId={chainId} path={`address/${address}`}>
                  View on block explorer
                </ExplorerLink>
              </dd>
            </>
          )}
        </dl>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Balances &amp; escrow</h3>
          <TokenSelector
            selectedToken={selectedToken}
            onTokenChange={setSelectedToken}
          />
        </div>
        <p className={styles.cardText} style={{ marginBottom: 14 }}>
          Escrow holds funds reserved for Compute-to-Data jobs. Funds that are
          no longer locked can be withdrawn back to your wallet.
        </p>
        <Stats selectedToken={selectedToken} variant="funds" />
      </div>

      {isMetaMask && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Add tokens to MetaMask</h3>
          <AddTokenList />
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.rows}>
          <div className={styles.row}>
            <span>
              <span className={styles.rowTitle}>Disconnect wallet</span>
              <span className={styles.rowText}>
                Ends the wallet connection in this browser. A managed wallet
                reconnects automatically the next time you continue.
              </span>
            </span>
            <button
              type="button"
              className={styles.buttonSecondary}
              onClick={() => disconnect()}
              disabled={!isConnected}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
