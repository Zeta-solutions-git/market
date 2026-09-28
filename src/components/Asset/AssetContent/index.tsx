import {
  ReactElement,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from 'react'
import Markdown from '@shared/Markdown'
import MetaFull from './MetaFull'
import MetaSecondary, { hasSampleFiles } from './MetaSecondary'
import { useUserPreferences } from '@context/UserPreferences'
import Bookmark from './Bookmark'
import { useAsset } from '@context/Asset'
import Alert from '@shared/atoms/Alert'
import DebugOutput from '@shared/DebugOutput'
import styles from './index.module.css'
import content from '../../../../content/purgatory.json'
import RelatedAssets from '../RelatedAssets'
import { useAccount } from 'wagmi'
import { AssetExtended } from 'src/@types/AssetExtended'
import { LanguageValueObject } from 'src/@types/ddo/LanguageValueObject'
import MetaInfo from './MetaMain/MetaInfo'
import MetaAsset from './MetaMain/MetaAsset'
import Nft from './Nft'
import Tags from '@shared/atoms/AssetTags'
import ExternalContentWarning from '@shared/ExternalContentWarning'
import ComputeJobs from '@components/@shared/ComputeJobs'
import SampleFilesDropdown from './SampleFilesDropdown'
import AllowedAlgorithms from './AllowedAlgorithms'
import AccessPanel, { ServiceOption, servicePriceLabel } from './AccessPanel'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'

const blockscoutNetworks = [1287, 2021000, 2021001, 44787, 246, 1285]

// the description may pull in remote images/embeds; only then ask to allow it
const EXTERNAL_CONTENT = /!\[[^\]]*\]\(\s*https?:|<(img|iframe|video|audio)\b/i

function getDescription(asset: AssetExtended): string {
  const description = asset.credentialSubject?.metadata?.description as
    | LanguageValueObject
    | string
    | undefined
  if (!description) return ''
  if (typeof description === 'string') return description
  return description['@value'] || ''
}

interface Section {
  id: string
  label: string
}

// In-page navigation that stays in view and highlights the section on screen.
function SectionNav({ sections }: { sections: Section[] }): ReactElement {
  const [active, setActive] = useState(sections[0]?.id)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )
    sections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 2) return null

  return (
    <nav className={styles.sectionNav} aria-label="On this page">
      {sections.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          className={active === id ? styles.navActive : undefined}
          aria-current={active === id ? 'true' : undefined}
          onClick={() => setActive(id)}
        >
          {label}
        </a>
      ))}
    </nav>
  )
}

export default function AssetContent({
  asset
}: {
  asset: AssetExtended
}): ReactElement {
  const router = useRouter()
  const { isInPurgatory, purgatoryData } = useAsset()
  const { address: accountId } = useAccount()
  const { allowExternalContent, debug } = useUserPreferences()
  const [selectedService, setSelectedService] = useState<number | undefined>()
  const isPublished = Boolean(asset?.indexedMetadata?.nft?.created)
  const [computeJobsRefetchTrigger, setComputeJobsRefetchTrigger] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const [showDdo, setShowDdo] = useState(false)
  const [panelInView, setPanelInView] = useState(true)
  const descriptionRef = useRef<HTMLDivElement>(null)

  const metadata = asset.credentialSubject?.metadata
  const services = asset.credentialSubject?.services
  const isAlgorithm = metadata?.type === 'algorithm'
  const description = getDescription(asset)
  const hasExternalContent = EXTERNAL_CONTENT.test(description)
  const showSamples = hasSampleFiles(asset)

  // keep the original service index: accessDetails and the actions use it
  const serviceOptions: ServiceOption[] = useMemo(
    () =>
      (services || [])
        .map((service, index) => ({ service, index }))
        .filter(({ service }) => service.state === 0),
    [services]
  )

  const computeServices = serviceOptions.filter(
    ({ service }) => service.type === 'compute'
  )

  // Find compute service
  const computeServiceIndex = services?.findIndex(
    (service) => service.type === 'compute'
  )

  // one service: nothing to choose, select it straight away
  useEffect(() => {
    if (selectedService !== undefined) return
    if (serviceOptions.length === 1) setSelectedService(serviceOptions[0].index)
  }, [serviceOptions, selectedService])

  const rerunJobQuery = useMemo(() => {
    const value = router.query.rerunJob ?? router.query.rerun
    if (typeof value === 'string') return value
    if (Array.isArray(value) && value.length > 0) return value[0]
    return null
  }, [router.query.rerunJob, router.query.rerun])
  const processedRerunJobRef = useRef<string | null>(null)

  const clearRerunQueryFromUrl = useCallback(() => {
    if (!router.isReady) return

    const [pathname, search = ''] = router.asPath.split('?')
    if (!search) return

    const params = new URLSearchParams(search)
    const hasRerunParam = params.has('rerunJob') || params.has('rerun')
    if (!hasRerunParam) return

    params.delete('rerunJob')
    params.delete('rerun')
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname
    router
      .replace(nextUrl, undefined, { shallow: true, scroll: false })
      .catch((error) => {
        console.error('Failed to clear rerun query param', error)
      })
  }, [router])

  useEffect(() => {
    if (rerunJobQuery) return
    processedRerunJobRef.current = null
  }, [rerunJobQuery])

  useEffect(() => {
    if (!router.isReady) return
    if (!rerunJobQuery) return
    if (processedRerunJobRef.current === rerunJobQuery) return

    processedRerunJobRef.current = rerunJobQuery

    if (Number(asset?.indexedMetadata?.nft?.state) !== 0) {
      toast.error('Algorithm is not available.')
      clearRerunQueryFromUrl()
      return
    }

    if (computeServiceIndex === undefined || computeServiceIndex < 0) {
      toast.error('Algorithm is not available.')
      clearRerunQueryFromUrl()
      return
    }

    setSelectedService(computeServiceIndex)
  }, [
    router.isReady,
    rerunJobQuery,
    computeServiceIndex,
    asset?.indexedMetadata?.nft?.state,
    clearRerunQueryFromUrl
  ])

  // only offer "Show more" when the description is actually cut off
  useEffect(() => {
    const el = descriptionRef.current
    if (!el || expanded) return
    const measure = () => setIsClamped(el.scrollHeight > el.clientHeight + 2)
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [description, expanded, allowExternalContent])

  // phones: once the access panel scrolls away, offer a bar to jump back to it
  useEffect(() => {
    const panel = document.getElementById('access')
    if (!panel || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) =>
      setPanelInView(entry.isIntersecting || entry.boundingClientRect.top > 0)
    )
    observer.observe(panel)
    return () => observer.disconnect()
  }, [])

  // room for the fixed bar at the bottom of the page (phones only, see CSS)
  const showMobileBar = !panelInView && serviceOptions.length > 0
  useEffect(() => {
    document.body.classList.toggle('asset-mobile-bar', showMobileBar)
    return () => document.body.classList.remove('asset-mobile-bar')
  }, [showMobileBar])

  const sections: Section[] = useMemo(
    () =>
      [
        { id: 'overview', label: 'Overview' },
        showSamples && { id: 'samples', label: 'Sample data' },
        { id: 'details', label: 'Details' },
        computeServices.length > 0 && {
          id: 'compute',
          label: 'Compute-to-Data'
        },
        { id: 'technical', label: 'Technical' }
      ].filter(Boolean) as Section[],
    [showSamples, computeServices.length]
  )

  const isBlockscoutExplorer = blockscoutNetworks.includes(
    asset?.credentialSubject?.chainId
  )
  const firstPrice = serviceOptions[0]
    ? servicePriceLabel(asset.accessDetails?.[serviceOptions[0].index])
    : ''

  return (
    <>
      <article className={styles.layout}>
        <header className={styles.hero}>
          <div className={styles.heroTop}>
            <MetaInfo asset={asset} nftPublisher={undefined} />
            <Bookmark did={asset.id} className={styles.bookmark} />
          </div>
          <h1 className={styles.title}>{metadata?.name || ''}</h1>
          <div className={styles.byline}>
            <MetaAsset asset={asset} />
            {!isInPurgatory && metadata?.author && (
              <span className={styles.author}>
                Data by <strong>{metadata.author}</strong>
              </span>
            )}
          </div>
          {metadata?.tags?.length > 0 && (
            <Tags items={metadata.tags} className={styles.tags} />
          )}
          {isInPurgatory === true && (
            <Alert
              title={content.asset.title}
              badge={`Reason: ${purgatoryData?.reason}`}
              text={content.asset.description}
              state="error"
            />
          )}
        </header>

        <aside className={styles.side}>
          <div className={styles.sticky}>
            <AccessPanel
              asset={asset}
              serviceOptions={serviceOptions}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              onComputeJobCreated={() =>
                setComputeJobsRefetchTrigger((prev) => prev + 1)
              }
            />
          </div>
        </aside>

        <div className={styles.main}>
          <SectionNav sections={sections} />

          {!isInPurgatory && (
            <section id="overview" className={styles.section}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              {hasExternalContent && !allowExternalContent && (
                <ExternalContentWarning />
              )}
              {description ? (
                <>
                  <div
                    ref={descriptionRef}
                    className={`${styles.description} ${
                      expanded ? styles.expanded : styles.collapsed
                    } ${!expanded && isClamped ? styles.clamped : ''}`}
                  >
                    <Markdown
                      text={description}
                      blockImages={!allowExternalContent}
                    />
                  </div>
                  {(isClamped || expanded) && (
                    <button
                      type="button"
                      className={styles.toggle}
                      aria-expanded={expanded}
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? 'Show less' : 'Show full description'}
                    </button>
                  )}
                </>
              ) : (
                <p className={styles.muted}>No description provided.</p>
              )}
            </section>
          )}

          {showSamples && (
            <section id="samples" className={styles.section}>
              <h2 className={styles.sectionTitle}>Sample data</h2>
              <p className={styles.muted}>
                Free example files so you can check the format before you get
                access.
              </p>
              <SampleFilesDropdown services={services} defaultExpanded />
            </section>
          )}

          <section id="details" className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <MetaFull ddo={asset} part="details" />
          </section>

          {computeServices.length > 0 && (
            <section id="compute" className={styles.section}>
              <h2 className={styles.sectionTitle}>Compute-to-Data</h2>
              {isAlgorithm ? (
                <p className={styles.muted}>
                  This algorithm runs on datasets whose publishers approved it.
                  You pick the dataset when you start a compute job; the data
                  never leaves its provider.
                </p>
              ) : (
                <>
                  <p className={styles.muted}>
                    This dataset can be used in compute jobs: approved
                    algorithms run next to the data, and you only receive the
                    results.
                  </p>
                  {computeServices.map(({ service }) => (
                    <div key={service.id} className={styles.subsection}>
                      <h3 className={styles.subTitle}>
                        Algorithms you can run
                        {computeServices.length > 1 && ` (${service.name})`}
                      </h3>
                      <AllowedAlgorithms asset={asset} service={service} />
                    </div>
                  ))}
                </>
              )}
              {isPublished &&
                accountId &&
                computeServiceIndex !== undefined &&
                computeServiceIndex >= 0 && (
                  <div className={styles.jobs}>
                    <ComputeJobs
                      asset={asset}
                      refetchTrigger={computeJobsRefetchTrigger}
                    />
                  </div>
                )}
            </section>
          )}

          <section id="technical" className={styles.section}>
            <details className={styles.technical}>
              <summary>
                <h2 className={styles.sectionTitle}>Technical details</h2>
                <span className={styles.muted}>
                  Identifiers, network and on-chain data
                </span>
              </summary>
              <div className={styles.technicalBody}>
                <div className={styles.nftRow}>
                  <Nft isBlockscoutExplorer={isBlockscoutExplorer} />
                  <MetaFull ddo={asset} part="technical" />
                </div>
                {debug === true ? (
                  <DebugOutput title="DDO" output={asset} />
                ) : showDdo ? (
                  <DebugOutput
                    output={asset}
                    headerLeft={
                      <button
                        type="button"
                        className={styles.ddoToggleButton}
                        onClick={() => setShowDdo(false)}
                        aria-expanded={showDdo}
                      >
                        Hide DDO
                      </button>
                    }
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.ddoToggleButton}
                    onClick={() => setShowDdo(true)}
                    aria-expanded={showDdo}
                  >
                    Show DDO (raw metadata)
                  </button>
                )}
              </div>
            </details>
          </section>
        </div>
      </article>

      {showMobileBar && (
        <div className={styles.mobileBar}>
          <span className={styles.mobileBarPrice}>{firstPrice}</span>
          <a href="#access" className={styles.mobileBarButton}>
            Get access
          </a>
        </div>
      )}

      <RelatedAssets />
    </>
  )
}
