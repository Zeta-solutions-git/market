import { ReactElement } from 'react'
import MetaItem from './MetaItem'
import styles from './MetaSecondary.module.css'
import Tags from '@shared/atoms/AssetTags'
import { Asset } from 'src/@types/Asset'
import SampleFilesDropdown from './SampleFilesDropdown'

export function hasSampleFiles(ddo: Asset): boolean {
  // Sample data files live on the individual services (`service.links`)
  return Boolean(
    ddo?.credentialSubject?.services?.some(
      (service) => service.links && Object.keys(service.links).length > 0
    )
  )
}

// The asset page places the tags in the header and the samples in their own
// section; `part` picks one of them, the default renders both.
export default function MetaSecondary({
  ddo,
  part = 'all'
}: {
  ddo: Asset
  part?: 'samples' | 'tags' | 'all'
}): ReactElement {
  const showSamples = part !== 'tags' && hasSampleFiles(ddo)
  const showTags =
    part !== 'samples' && ddo?.credentialSubject?.metadata?.tags?.length > 0

  if (!showSamples && !showTags) return null

  return (
    <aside className={styles.metaSecondary}>
      {showSamples && (
        <div className={styles.samples}>
          <MetaItem
            title="Sample Data"
            content={
              <SampleFilesDropdown
                services={ddo?.credentialSubject?.services}
              />
            }
          />
        </div>
      )}
      {showTags && <Tags items={ddo?.credentialSubject?.metadata?.tags} />}
    </aside>
  )
}
