import { ReactElement } from 'react'
import Link from 'next/link'
import removeMarkdown from 'remove-markdown'
import Publisher from '@shared/Publisher'
import styles from './index.module.css'
import { AssetExtended } from 'src/@types/AssetExtended'
import Bookmark from '@components/Asset/AssetContent/Bookmark'
import { getAssetPriceLabel, getAssetUsageLabels } from '@utils/assetPriceLabel'
import { useHackathon } from '@hooks/useHackathon'

declare type AssetTeaserProps = {
  asset: AssetExtended
  noPublisher?: boolean
  noDescription?: boolean
  noPrice?: boolean
  // "row": slim full-width card for the catalogue's list view
  variant?: 'card' | 'row'
}

const MAX_TAGS = 3

function descriptionText(asset: AssetExtended): string {
  const description = asset.credentialSubject?.metadata?.description as
    | { '@value'?: string }
    | string
    | undefined
  const raw =
    typeof description === 'string' ? description : description?.['@value']
  return removeMarkdown((raw || '').substring(0, 400))
}

// Catalogue card, in the style of the homepage feature cards: type icon +
// label, title, publisher, short description, tags, and how it can be used.
export default function AssetTeaser({
  asset,
  noPublisher,
  noDescription,
  noPrice,
  variant = 'card'
}: AssetTeaserProps): ReactElement {
  const { name, type, tags } = asset.credentialSubject.metadata
  const isAlgorithm = type === 'algorithm'
  const owner = asset.indexedMetadata?.nft?.owner
  const orders = asset.indexedMetadata?.stats?.[0]?.orders
  const description = noDescription ? '' : descriptionText(asset)
  const usage = getAssetUsageLabels(asset)
  const price = noPrice ? undefined : getAssetPriceLabel(asset)
  const shownTags = (tags || []).filter(Boolean).slice(0, MAX_TAGS)
  // temporary (hackathon week): which challenge folder(s) this asset is in
  const challenges = useHackathon().challengesFor(asset.id)

  return (
    <article
      className={`${styles.teaser} ${variant === 'row' ? styles.row : ''}`}
    >
      <Link href={`/asset/${asset.id}`} className={styles.link}>
        <div className={styles.typeRow}>
          <span
            className={`material-symbols-rounded ${styles.typeIcon}`}
            aria-hidden="true"
          >
            {isAlgorithm ? 'code_blocks' : 'database'}
          </span>
          <span className={styles.typeLabel}>
            {isAlgorithm ? 'Algorithm' : 'Dataset'}
          </span>
          {challenges.map((c) => (
            <span
              key={c.id}
              className={styles.challenge}
              title={`Hackathon challenge ${c.id}: ${c.name}`}
            >
              Challenge {c.id}
            </span>
          ))}
        </div>

        <h3 className={styles.title}>{name?.slice(0, 200)}</h3>

        {!noPublisher && owner && (
          <span className={styles.owner}>
            by <Publisher account={owner} minimal />
          </span>
        )}

        {description && <p className={styles.description}>{description}</p>}

        {shownTags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {shownTags.map((tag) => (
              <li key={tag} className={styles.tag}>
                {tag}
              </li>
            ))}
          </ul>
        )}

        <footer className={styles.footer}>
          <span className={styles.usage}>
            {usage.map((label) => (
              <span key={label} className={styles.chip}>
                {label}
              </span>
            ))}
          </span>
          <span className={styles.meta}>
            {orders > 0 && (
              <span className={styles.sales}>
                {orders} {orders === 1 ? 'sale' : 'sales'}
              </span>
            )}
            {price && <span className={styles.price}>{price}</span>}
          </span>
        </footer>
      </Link>
      <Bookmark did={asset.id} className={styles.bookmark} />
    </article>
  )
}
