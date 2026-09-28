import { ReactElement } from 'react'
import MetaItem from './MetaItem'
import styles from './MetaFull.module.css'
import Publisher from '@shared/Publisher'
import { useAsset } from '@context/Asset'
import { Asset } from 'src/@types/Asset'
import { IpfsRemoteSource } from '@components/@shared/IpfsRemoteSource'
import NetworkName from '@shared/NetworkName'
import { assetStateToString } from '@utils/assetState'
import { safeExternalWebUrl } from '@utils/url'
import AdditionalLicenseFiles from './AdditionalLicenseFiles'
import MetaLinks from './MetaLinks'
import TruncatedMetaValue from './TruncatedMetaValue'
import Copy from '@shared/atoms/Copy'

// The asset page shows the human-facing details ("details") in the main
// column and tucks the identifiers/infrastructure ("technical") into a
// collapsed section. `part="all"` renders both, one after the other.
// long identifiers: truncated in the middle (full value on hover) + copy button
function Identifier({
  value,
  start,
  end
}: {
  value: string
  start: number
  end: number
}): ReactElement {
  return (
    <span className={styles.identifier}>
      <TruncatedMetaValue value={value} start={start} end={end} />
      <Copy text={value} />
    </span>
  )
}

export type MetaFullPart = 'details' | 'technical' | 'all'

export default function MetaFull({
  ddo,
  part = 'all'
}: {
  ddo: Asset
  part?: MetaFullPart
}): ReactElement {
  const { isInPurgatory, assetState, asset } = useAsset()
  const credentialSubject = ddo?.credentialSubject
  const metadata = credentialSubject?.metadata
  const license = credentialSubject?.license || metadata?.license
  const primaryLicenseDocument = license?.licenseDocuments?.[0]
  const primaryLicenseMirror = primaryLicenseDocument?.mirrors?.[0]
  const oeNode = credentialSubject?.services?.[0]?.serviceEndpoint
  const datatokenAddress =
    ddo?.indexedMetadata?.stats?.[0]?.datatokenAddress ||
    credentialSubject?.datatokens?.[0]?.address
  const algorithmContainer = metadata?.algorithm?.container
  const dockerImage =
    algorithmContainer?.image && algorithmContainer?.tag
      ? `${algorithmContainer.image}:${algorithmContainer.tag}`
      : undefined

  const effectiveAssetState =
    assetState ||
    (ddo?.indexedMetadata?.nft?.state !== undefined
      ? assetStateToString(ddo.indexedMetadata.nft.state)
      : 'Active')

  const paymentCollector = asset?.accessDetails?.[0]?.paymentCollector
  const publisherDid = ddo?.issuer

  if (!ddo) return null

  const details = (
    <div className={styles.section}>
      <div className={styles.fields}>
        {!isInPurgatory && metadata?.author && (
          <MetaItem title="Data Author" content={metadata.author} />
        )}
        {metadata?.copyrightHolder && (
          <MetaItem
            title="Copyright Holder"
            content={metadata.copyrightHolder}
          />
        )}
        {metadata?.providedBy && (
          <MetaItem
            title="Provided By"
            content={
              <a
                href={safeExternalWebUrl(metadata.providedBy)}
                target="_blank"
                rel="noreferrer"
              >
                {metadata.providedBy}
              </a>
            }
          />
        )}
        <MetaItem
          title="Owner"
          content={<Publisher account={ddo?.indexedMetadata?.nft?.owner} />}
        />
        {paymentCollector &&
          paymentCollector !== ddo?.indexedMetadata?.nft?.owner && (
            <MetaItem
              title="Revenue Sent To"
              content={<Publisher account={paymentCollector} />}
            />
          )}
        {effectiveAssetState !== 'Active' && (
          <MetaItem title="Asset State" content={effectiveAssetState} />
        )}
        {metadata?.type === 'algorithm' && dockerImage && (
          <MetaItem title="Docker Image" content={<code>{dockerImage}</code>} />
        )}
        {metadata?.type === 'algorithm' && algorithmContainer?.entrypoint && (
          <MetaItem
            title="Entrypoint"
            content={<code>{algorithmContainer.entrypoint}</code>}
          />
        )}
        <MetaItem
          title="License"
          content={
            <div className={styles.license}>
              {primaryLicenseMirror?.type === 'url' &&
              primaryLicenseMirror?.url ? (
                <a
                  target="_blank"
                  href={safeExternalWebUrl(primaryLicenseMirror.url)}
                  rel="noreferrer"
                >
                  {primaryLicenseDocument.name}
                </a>
              ) : (
                <IpfsRemoteSource
                  noDocumentLabel="No license document available"
                  remoteSource={primaryLicenseMirror}
                  name={primaryLicenseDocument?.name}
                />
              )}
              <AdditionalLicenseFiles
                licenseDocuments={license?.licenseDocuments}
              />
            </div>
          }
        />
      </div>
      <MetaLinks links={metadata?.links} />
    </div>
  )

  const technical = (
    <div className={`${styles.fields} ${styles.technical}`}>
      <MetaItem
        title="DID"
        content={<Identifier value={ddo.id} start={12} end={8} />}
      />
      {publisherDid && (
        <MetaItem
          title="Publisher DID"
          content={<Identifier value={publisherDid} start={12} end={12} />}
        />
      )}
      {credentialSubject?.chainId && (
        <MetaItem
          title="Network"
          content={<NetworkName networkId={credentialSubject.chainId} />}
        />
      )}
      <MetaItem title="OE Node" content={oeNode || 'Not available'} />
      {datatokenAddress && (
        <MetaItem
          title="Datatoken"
          content={<Identifier value={datatokenAddress} start={8} end={6} />}
        />
      )}
      {credentialSubject?.nftAddress && (
        <MetaItem
          title="Data NFT"
          content={
            <Identifier
              value={credentialSubject.nftAddress}
              start={8}
              end={6}
            />
          }
        />
      )}
    </div>
  )

  if (part === 'details') return details
  if (part === 'technical') return technical
  return (
    <>
      {details}
      {technical}
    </>
  )
}
