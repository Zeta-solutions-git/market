import { ReactElement, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { useAsset } from '@context/Asset'
import { useSsiWallet } from '@context/SsiWallet'
import { useAuth } from '@hooks/useAuth'
import { useSignerServerConnect } from '@hooks/useSignerServerConnect'
import Web3Feedback from '@shared/Web3Feedback'
import NetworkName from '@shared/NetworkName'
import Loader from '@shared/atoms/Loader'
import ServiceTypeIcon from '@shared/ServiceTypeIcon'
import { accountTruncate } from '@utils/wallet'
import { formatServiceTimeout, isAddressWhitelisted } from '@utils/ddo'
import EditIcon from '@images/edit.svg'
import AssetActions from '../AssetActions'
import { AssetExtended } from 'src/@types/AssetExtended'
import { Service } from 'src/@types/ddo/Service'
import styles from './AccessPanel.module.css'

export interface ServiceOption {
  service: Service
  // index into credentialSubject.services / accessDetails
  index: number
}

export function serviceTypeLabel(type: string): string {
  return type === 'compute' ? 'Compute-to-Data' : 'Download'
}

export function servicePriceLabel(accessDetails?: AccessDetails): string {
  if (!accessDetails) return ''
  if (accessDetails.type === 'fixed')
    return `${accessDetails.price} ${accessDetails.baseToken?.symbol || ''}`
  return 'Free'
}

function ServiceRow({
  option,
  accessDetails,
  selected,
  selectable,
  onSelect
}: {
  option: ServiceOption
  accessDetails?: AccessDetails
  selected: boolean
  selectable: boolean
  onSelect: () => void
}): ReactElement {
  const { service } = option
  const description = service.description?.['@value']
  const content = (
    <>
      <span className={styles.serviceHead}>
        <span className={styles.serviceName}>
          {service.name || 'Unnamed service'}
        </span>
        <span className={styles.servicePrice}>
          {servicePriceLabel(accessDetails)}
        </span>
      </span>
      <span className={styles.serviceMeta}>
        <span className={styles.serviceType}>
          <ServiceTypeIcon type={service.type} className={styles.typeIcon} />
          {serviceTypeLabel(service.type)}
        </span>
        <span aria-hidden="true">·</span>
        <span>Access: {formatServiceTimeout(service.timeout)}</span>
      </span>
      {description && (
        <span
          className={`${styles.serviceDescription} ${
            selected ? styles.serviceDescriptionFull : ''
          }`}
        >
          {description}
        </span>
      )}
    </>
  )

  if (!selectable)
    return <div className={`${styles.service} ${styles.single}`}>{content}</div>

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={`${styles.service} ${selected ? styles.selected : ''}`}
      onClick={onSelect}
    >
      <span className={styles.radio} aria-hidden="true" />
      <span className={styles.serviceBody}>{content}</span>
    </button>
  )
}

// Wallet, network, allow-list and SSI details. Collapsed by default: people
// only need them when something is wrong, and then the panel says so above.
function WalletDetails({
  asset,
  service
}: {
  asset: AssetExtended
  service?: Service
}): ReactElement {
  const { address: accountId } = useAccount()
  const { selectedWallet } = useSsiWallet()
  const allowed =
    accountId && service
      ? isAddressWhitelisted(asset, accountId, service)
      : undefined

  return (
    <details className={styles.walletDetails}>
      <summary>Wallet &amp; credentials</summary>
      <div className={styles.walletBody}>
        <dl className={styles.walletFields}>
          <dt>Network</dt>
          <dd>
            <NetworkName
              networkId={asset.credentialSubject?.chainId}
              className={styles.network}
            />
          </dd>
          <dt>Account</dt>
          <dd>
            {accountId ? (
              <code title={accountId}>{accountTruncate(accountId)}</code>
            ) : (
              'Not connected'
            )}
          </dd>
          {allowed !== undefined && (
            <>
              <dt>Access list</dt>
              <dd className={allowed ? styles.ok : styles.bad}>
                {allowed
                  ? 'Your account is allowed'
                  : 'Your account is not allowed'}
              </dd>
            </>
          )}
          <dt>Credentials wallet</dt>
          <dd>{selectedWallet?.name || 'Not connected'}</dd>
        </dl>
        <Link href="/profile?section=wallet" className={styles.walletLink}>
          Manage wallet &amp; credentials
        </Link>
      </div>
    </details>
  )
}

export default function AccessPanel({
  asset,
  serviceOptions,
  selectedService,
  onSelectService,
  onComputeJobCreated
}: {
  asset: AssetExtended
  serviceOptions: ServiceOption[]
  selectedService?: number
  onSelectService: (index: number | undefined) => void
  onComputeJobCreated: () => void
}): ReactElement {
  const router = useRouter()
  const { address: accountId, isConnected, status: walletStatus } = useAccount()
  const { isOwner, isAssetNetwork } = useAsset()
  const { authEnabled, isAuthenticated, isSessionVerified, beginOidcFlow } =
    useAuth()
  const signerServer = useSignerServerConnect()
  const autoConnectTried = useRef(false)

  // Logged in but the managed wallet isn't connected (e.g. after a reload):
  // connect it for them, like onboarding does, instead of asking.
  useEffect(() => {
    if (!authEnabled || !isAuthenticated || accountId) return
    if (walletStatus === 'connecting' || walletStatus === 'reconnecting') return
    if (!signerServer.isHealthChecked || !signerServer.isConfigured) return
    if (autoConnectTried.current) return
    autoConnectTried.current = true
    signerServer.connect().catch(() => undefined)
  }, [
    authEnabled,
    isAuthenticated,
    accountId,
    walletStatus,
    signerServer.isHealthChecked,
    signerServer.isConfigured,
    signerServer
  ])

  const isPublished = Boolean(asset?.indexedMetadata?.nft?.created)
  const isActive = asset?.indexedMetadata?.nft?.state === 0
  const assetType =
    asset.credentialSubject?.metadata?.type === 'algorithm'
      ? 'algorithm'
      : 'dataset'
  const selected = serviceOptions.find((o) => o.index === selectedService)
  const needsLogin = authEnabled && isSessionVerified && !isAuthenticated
  const authPending = authEnabled && !isSessionVerified
  const hasWalletProblem =
    !needsLogin && !authPending && (!accountId || isAssetNetwork === false)
  const canAct =
    isPublished && isConnected && isAssetNetwork && !needsLogin && !authPending
  const returnTo = router.asPath

  function renderAction(): ReactElement {
    if (!isPublished)
      return (
        <p className={styles.hint}>
          Buttons to get access appear here once the asset is published.
        </p>
      )
    if (authPending) return <Loader message="Checking your session…" />
    if (needsLogin)
      return (
        <div className={styles.loginBox}>
          <button
            type="button"
            className={styles.cta}
            onClick={() =>
              beginOidcFlow('login', returnTo).catch(() => undefined)
            }
          >
            Log in to get access
          </button>
          <p className={styles.hint}>
            No account yet?{' '}
            <button
              type="button"
              className={styles.inlineLink}
              onClick={() =>
                beginOidcFlow('signup', returnTo).catch(() => undefined)
              }
            >
              Sign up
            </button>
          </p>
        </div>
      )
    if (!accountId && authEnabled && isAuthenticated) {
      const busy =
        signerServer.isConnecting ||
        walletStatus === 'connecting' ||
        walletStatus === 'reconnecting' ||
        !signerServer.isHealthChecked
      if (busy) return <Loader message="Connecting your wallet…" />
      if (signerServer.isConfigured)
        return (
          <div className={styles.loginBox}>
            <p className={styles.hint}>Your wallet isn&apos;t connected yet.</p>
            <button
              type="button"
              className={styles.cta}
              onClick={signerServer.openConnect}
            >
              Connect my wallet
            </button>
          </div>
        )
    }
    if (hasWalletProblem)
      return (
        <Web3Feedback accountId={accountId} isAssetNetwork={isAssetNetwork} />
      )
    if (!selected)
      return <p className={styles.hint}>Select a service to continue.</p>
    return (
      <AssetActions
        key={selected.index}
        asset={asset}
        service={asset.credentialSubject?.services[selected.index]}
        accessDetails={asset.accessDetails[selected.index]}
        serviceIndex={selected.index}
        handleBack={() => onSelectService(undefined)}
        hideBackButton
        onComputeJobCreated={onComputeJobCreated}
      />
    )
  }

  return (
    <div className={styles.panel} id="access">
      <section className={styles.card} aria-labelledby="access-title">
        <h2 id="access-title" className={styles.title}>
          {serviceOptions.length > 1 ? 'Choose how to use it' : 'Get access'}
        </h2>

        {!asset.accessDetails ? (
          <Loader message="Loading access details…" />
        ) : !isActive ? (
          <p className={styles.hint}>
            {asset?.indexedMetadata?.nft?.owner === accountId
              ? 'You are the asset owner.'
              : 'Services cannot be ordered.'}
          </p>
        ) : serviceOptions.length === 0 ? (
          <p className={styles.hint}>No services are currently available.</p>
        ) : (
          <>
            <div
              className={styles.services}
              role={serviceOptions.length > 1 ? 'radiogroup' : undefined}
              aria-label="Services"
            >
              {serviceOptions.map((option) => (
                <ServiceRow
                  key={option.service.id}
                  option={option}
                  accessDetails={asset.accessDetails[option.index]}
                  selected={option.index === selectedService}
                  selectable={serviceOptions.length > 1}
                  onSelect={() => onSelectService(option.index)}
                />
              ))}
            </div>
            {selected?.service.type === 'compute' && (
              <p className={styles.note}>
                {assetType === 'dataset'
                  ? 'The data stays with the provider: you run an approved algorithm on it and get the results. '
                  : 'You run this algorithm on data that stays with its provider, and get the results. '}
                You choose the {assetType === 'dataset' ? 'algorithm' : 'data'},
                environment and review all costs before anything starts.
              </p>
            )}
            <div className={styles.action}>{renderAction()}</div>
          </>
        )}

        {isOwner && isAssetNetwork && isConnected && (
          <div className={styles.owner}>
            <span>You own this asset.</span>
            <Link
              href={`/asset/${asset.id}/edit`}
              className={styles.secondaryButton}
            >
              <EditIcon className={styles.editIcon} />
              Edit asset
            </Link>
          </div>
        )}
      </section>

      {canAct || hasWalletProblem ? (
        <WalletDetails asset={asset} service={selected?.service} />
      ) : null}
    </div>
  )
}
