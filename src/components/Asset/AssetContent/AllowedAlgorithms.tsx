import { ReactElement, useEffect, useState } from 'react'
import Link from 'next/link'
import { LoggerInstance } from '@oceanprotocol/lib'
import { getAlgorithmsForAsset } from '@utils/compute'
import { useCancelToken } from '@hooks/useCancelToken'
import Publisher from '@shared/Publisher'
import { Asset } from 'src/@types/Asset'
import { Service } from 'src/@types/ddo/Service'
import styles from './AssetSections.module.css'

const MAX_SHOWN = 6

// For a dataset with a compute service: the algorithms its publisher allows to
// run on it (the same allow-list the compute wizard offers in step 1).
export default function AllowedAlgorithms({
  asset,
  service
}: {
  asset: Asset
  service: Service
}): ReactElement {
  const newCancelToken = useCancelToken()
  const [algorithms, setAlgorithms] = useState<Asset[]>()
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAlgorithmsForAsset(asset, service, newCancelToken())
      .then((result) => {
        if (!cancelled) setAlgorithms(result || [])
      })
      .catch((error) => {
        LoggerInstance.warn('[AllowedAlgorithms]', error?.message)
        if (!cancelled) setAlgorithms([])
      })
    return () => {
      cancelled = true
    }
  }, [asset, service, newCancelToken])

  if (algorithms === undefined)
    return <p className={styles.muted}>Loading allowed algorithms…</p>

  if (algorithms.length === 0)
    return (
      <p className={styles.muted}>
        The publisher hasn&apos;t approved any algorithms for this dataset yet.
      </p>
    )

  const shown = showAll ? algorithms : algorithms.slice(0, MAX_SHOWN)

  return (
    <>
      <ul className={styles.algoList}>
        {shown.map((algo) => (
          <li key={algo.id} className={styles.algoItem}>
            <Link href={`/asset/${algo.id}`} className={styles.algoName}>
              {algo.credentialSubject?.metadata?.name || algo.id}
            </Link>
            <span className={styles.algoMeta}>
              by <Publisher account={algo.indexedMetadata?.nft?.owner} />
            </span>
          </li>
        ))}
      </ul>
      {algorithms.length > MAX_SHOWN && (
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll ? 'Show fewer' : `Show all ${algorithms.length} algorithms`}
        </button>
      )}
    </>
  )
}
