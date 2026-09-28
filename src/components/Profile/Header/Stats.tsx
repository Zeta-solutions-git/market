import { ReactElement, useState } from 'react'
import NumberUnit from './NumberUnit'
import styles from './Stats.module.css'
import { useProfile } from '@context/Profile'
import EscrowWithdrawModal from './EscrowWithdrawModal'
import { formatToFixedNoRounding } from '@utils/numbers'
import { parseTokenSelection } from './TokenSelector'
import { useChainId } from 'wagmi'
import useNetworkMetadata, {
  getNetworkDataById,
  getNetworkDisplayName
} from '@hooks/useNetworkMetadata'

function TokenAmount({
  amount,
  token
}: {
  amount: string
  token: string
}): ReactElement {
  const value = `${amount} ${token}`

  return (
    <span className={styles.tokenAmount} title={value}>
      <span>{amount}</span>
      <span className={styles.tokenSymbol}>{token}</span>
    </span>
  )
}

function EscrowAvailableLabel({
  hasAvailable
}: {
  hasAvailable: boolean
}): ReactElement {
  return (
    <>
      <span className={styles.escrowAvailableLabel}>
        Escrow Available Funds
      </span>
    </>
  )
}

// variant: 'activity' = sales/published/downloads/revenue (profile overview),
// 'funds' = balance + escrow (wallet section), 'all' = everything.
export default function Stats({
  selectedToken,
  variant = 'all'
}: {
  selectedToken?: string
  variant?: 'all' | 'activity' | 'funds'
}): ReactElement {
  const showActivity = variant !== 'funds'
  const showFunds = variant !== 'activity'
  const {
    activeAssetsTotal,
    activeSales,
    activeDownloadsTotal,
    revenue,
    revenueByNetwork,
    escrowFundsByToken,
    tokenBalancesByToken,
    ownAccount
  } = useProfile()
  const activeChainId = useChainId()
  const activeChainIdString = activeChainId?.toString()
  const { networksList } = useNetworkMetadata()
  const [showModal, setShowModal] = useState(false)

  const activeToken =
    selectedToken ||
    Object.keys(revenueByNetwork?.[activeChainIdString] || {}).map(
      (symbol) => `${activeChainIdString}:${symbol}`
    )[0] ||
    Object.keys(escrowFundsByToken || {})[0] ||
    (!activeChainIdString ? Object.keys(revenue || {})[0] : '') ||
    ''
  const { chainId: selectedChainId, symbol: selectedSymbol } =
    parseTokenSelection(activeToken)
  const selectedRevenue = selectedChainId
    ? revenueByNetwork?.[selectedChainId]?.[selectedSymbol] || 0
    : revenue?.[selectedSymbol] || 0
  const selectedEscrow =
    (!selectedChainId || selectedChainId === activeChainIdString
      ? escrowFundsByToken?.[selectedSymbol]
      : null) || null
  const selectedEscrowAvailable = selectedEscrow?.available || '0'
  const selectedEscrowLocked = selectedEscrow?.locked || '0'
  const selectedBalance = tokenBalancesByToken?.[selectedSymbol]?.balance || '0'
  const hasAvailable = Number(selectedEscrowAvailable) > 0
  const selectedNetworkName = selectedChainId
    ? getNetworkDisplayName(
        getNetworkDataById(networksList, Number(selectedChainId))
      )
    : ''

  return (
    <div className={styles.stats}>
      {showActivity && (
        <>
          <NumberUnit
            label={`Sale${activeSales === 1 ? '' : 's'}`}
            value={activeSales < 0 ? 0 : activeSales}
          />
          <NumberUnit label="Published" value={activeAssetsTotal} />
          <NumberUnit label="Downloads" value={activeDownloadsTotal} />
        </>
      )}
      {showActivity && activeToken && (
        <NumberUnit
          label="Revenue"
          value={
            <TokenAmount
              amount={formatToFixedNoRounding(selectedRevenue, 3)}
              token={selectedSymbol}
            />
          }
          tooltip={selectedNetworkName || undefined}
        />
      )}
      {showFunds && ownAccount && activeToken && (
        <>
          <NumberUnit
            label="Balance"
            value={
              <TokenAmount
                amount={formatToFixedNoRounding(selectedBalance, 3)}
                token={selectedSymbol}
              />
            }
            tooltip={
              selectedChainId === activeChainIdString
                ? selectedNetworkName
                : undefined
            }
          />
          <NumberUnit
            label="Escrow Locked Funds"
            value={
              <TokenAmount
                amount={formatToFixedNoRounding(selectedEscrowLocked, 3)}
                token={selectedSymbol}
              />
            }
            tooltip={
              selectedChainId === activeChainIdString
                ? selectedNetworkName
                : undefined
            }
          />
          <div className={styles.escrowAvailable}>
            <NumberUnit
              label={<EscrowAvailableLabel hasAvailable={hasAvailable} />}
              value={
                <TokenAmount
                  amount={formatToFixedNoRounding(selectedEscrowAvailable, 3)}
                  token={selectedSymbol}
                />
              }
              tooltip={
                selectedChainId === activeChainIdString
                  ? selectedNetworkName
                  : undefined
              }
            />
            <button
              type="button"
              className={styles.withdrawButton}
              onClick={() => setShowModal(true)}
              disabled={!hasAvailable}
            >
              Withdraw
            </button>
          </div>
        </>
      )}

      {showModal && selectedEscrow && (
        <EscrowWithdrawModal
          escrowFunds={selectedEscrow}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
