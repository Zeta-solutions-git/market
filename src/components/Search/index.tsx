import { ReactElement, useState, useEffect, useCallback, useMemo } from 'react'
import AssetList from '@shared/AssetList'
import AssetViewSelector from '@shared/AssetList/AssetViewSelector'
import queryString from 'query-string'
import { buildSearchPageUrl, getResults } from './utils'
import { useCancelToken } from '@hooks/useCancelToken'
import styles from './index.module.css'
import { useRouter } from 'next/router'
import { useDebouncedCallback } from 'use-debounce'
import { useMarketMetadata } from '@context/MarketMetadata'
import { useUserPreferences } from '@context/UserPreferences'
import { useConnectorSupportedChains } from '@hooks/useDfnsWalletsByChain'
import {
  getNetworkDataById,
  getNetworkDisplayName
} from '@hooks/useNetworkMetadata'
import networkdata from '../../../content/networks-metadata.json'
import { accountTruncate } from '@utils/wallet'
import { MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS } from '@utils/aquarius'
import {
  FilterByAccessOptions,
  FilterByPriceOptions,
  FilterByTypeOptions,
  SortDirectionOptions,
  SortTermOptions
} from '../../@types/aquarius/SearchQuery'

// ---------------------------------------------------------------- URL state
// The URL is the single source of truth (shareable, back button works);
// getResults() reads the same params. Arrays are comma separated.
type Params = Record<string, string | string[] | undefined>

function asList(value: string | string[] | undefined): string[] {
  if (!value) return []
  return (Array.isArray(value) ? value : value.split(',')).filter(Boolean)
}

function buildUrl(params: Params): string {
  const parts = Object.entries(params)
    .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(v)))
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${(Array.isArray(v) ? v : [v])
          .map((item) => encodeURIComponent(item))
          .join(',')}`
    )
  return parts.length ? `/search?${parts.join('&')}` : '/search'
}

// ---------------------------------------------------------------- options
const TYPE_TABS = [
  { label: 'All', value: '' },
  { label: 'Datasets', value: FilterByTypeOptions.Data },
  { label: 'Algorithms', value: FilterByTypeOptions.Algorithm }
]

const FILTER_GROUPS = [
  {
    id: 'accessType',
    label: 'How you can use it',
    options: [
      { label: 'Download', value: FilterByAccessOptions.Download },
      { label: 'Compute-to-Data', value: FilterByAccessOptions.Compute }
    ]
  },
  {
    id: 'priceType',
    label: 'Price',
    options: [
      { label: 'Free', value: FilterByPriceOptions.Free },
      { label: 'Paid', value: FilterByPriceOptions.Paid }
    ]
  }
]

const { Created, Orders, Price, Relevance } = SortTermOptions
const { Ascending: ASC, Descending: DESC } = SortDirectionOptions
const SORT_OPTIONS = [
  { label: 'Best match', sort: Relevance, order: DESC },
  { label: 'Newest first', sort: Created, order: DESC },
  { label: 'Oldest first', sort: Created, order: ASC },
  { label: 'Most used', sort: Orders, order: DESC },
  { label: 'Price: low to high', sort: Price, order: ASC },
  { label: 'Price: high to low', sort: Price, order: DESC }
]
const sortKey = (sort: string, order: string) => `${sort}|${order}`

// ---------------------------------------------------------------- filters
function FilterPanel({
  params,
  chainOptions,
  onToggle,
  onClear,
  activeCount
}: {
  params: Params
  chainOptions: { label: string; value: string }[]
  onToggle: (id: string, value: string) => void
  onClear: () => void
  activeCount: number
}): ReactElement {
  const groups =
    chainOptions.length > 1
      ? [
          ...FILTER_GROUPS,
          { id: 'supportedBlockchain', label: 'Network', options: chainOptions }
        ]
      : FILTER_GROUPS

  return (
    <div className={styles.filterPanel}>
      {groups.map((group) => {
        const selected = asList(params[group.id])
        return (
          <fieldset key={group.id} className={styles.filterGroup}>
            <legend className={styles.filterLegend}>{group.label}</legend>
            {group.options.map((option) => {
              const id = `filter-${group.id}-${option.value}`
              return (
                <label key={option.value} htmlFor={id} className={styles.check}>
                  <input
                    id={id}
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => onToggle(group.id, option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              )
            })}
          </fieldset>
        )
      })}
      {activeCount > 0 && (
        <button type="button" className={styles.linkButton} onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- page
export default function SearchPage({
  setTotalResults,
  setTotalPagesNumber
}: {
  setTotalResults: (totalResults: number) => void
  setTotalPagesNumber: (totalPagesNumber: number) => void
}): ReactElement {
  const router = useRouter()
  const [parsed, setParsed] = useState<queryString.ParsedQuery<string>>()
  const { validatedSupportedChains, isValidatingSupportedChains } =
    useMarketMetadata()
  const { assetView, setAssetView } = useUserPreferences()
  const connectorSupportedChains = useConnectorSupportedChains()
  const [queryResult, setQueryResult] = useState<PagedAssets>()
  const [loading, setLoading] = useState<boolean>(true)
  const [text, setText] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const newCancelToken = useCancelToken()

  useEffect(() => {
    if (!router.isReady) return

    const parsed = queryString.parse(location.search, {
      arrayFormat: 'separator'
    })
    setParsed(parsed)
    const urlText = typeof parsed.text === 'string' ? parsed.text.trim() : ''
    // don't fight the user's typing (e.g. a trailing space) on our own updates
    setText((current) => (current.trim() === urlText ? current : urlText))
  }, [router.isReady, router.asPath])

  const params: Params = useMemo(() => (parsed || {}) as Params, [parsed])

  const navigate = useCallback(
    (updates: Params, keepPage = false) => {
      const next: Params = { ...params, ...updates }
      if (!keepPage) delete next.page
      router.push(buildUrl(next), undefined, { scroll: false })
    },
    [params, router]
  )

  const updatePage = useCallback(
    (page: number) => {
      setLoading(true)
      const newUrl = buildSearchPageUrl(router.pathname, location.search, page)
      return router.push(newUrl)
    },
    [router]
  )

  const fetchAssets = useDebouncedCallback(
    async (parsed: queryString.ParsedQuery<string>, chainIds: number[]) => {
      setLoading(true)
      setTotalResults(undefined)
      const queryResult = await getResults(parsed, chainIds, newCancelToken())
      setQueryResult(queryResult)

      setTotalResults(queryResult?.totalResults || 0)
      setTotalPagesNumber(queryResult?.totalPages || 0)
      setLoading(false)
    },
    500
  )
  useEffect(() => {
    if (!parsed || !queryResult) return
    const { page } = parsed
    if (queryResult.totalPages < Number(page)) updatePage(1)
  }, [parsed, queryResult, updatePage])

  useEffect(() => {
    if (
      !parsed ||
      isValidatingSupportedChains ||
      validatedSupportedChains.length === 0
    )
      return

    fetchAssets(parsed, validatedSupportedChains)
  }, [
    parsed,
    validatedSupportedChains,
    fetchAssets,
    isValidatingSupportedChains
  ])

  // search as you type; best match while searching, newest otherwise
  const applyText = useDebouncedCallback((value: string) => {
    const trimmed = value.trim()
    const currentSort = params.sort as string | undefined
    const updates: Params = { text: trimmed || undefined }
    if (trimmed && (!currentSort || currentSort === Created)) {
      updates.sort = Relevance
      updates.sortOrder = DESC
    }
    if (!trimmed && currentSort === Relevance) {
      updates.sort = undefined
      updates.sortOrder = undefined
    }
    navigate(updates)
  }, 400)

  function toggleFilter(id: string, value: string) {
    const selected = asList(params[id])
    navigate({
      [id]: selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    })
  }

  const chainOptions = connectorSupportedChains.map((chainId: number) => ({
    label: getNetworkDisplayName(getNetworkDataById(networkdata, chainId)),
    value: String(chainId)
  }))
  const labelFor = (id: string, value: string) =>
    [...FILTER_GROUPS, { id: 'supportedBlockchain', options: chainOptions }]
      .find((g) => g.id === id)
      ?.options.find((o) => o.value === value)?.label || value

  // applied filters, shown as removable chips above the results
  const chips: { key: string; label: string; remove: () => void }[] = [
    ...['accessType', 'priceType', 'supportedBlockchain'].flatMap((id) =>
      asList(params[id]).map((value) => ({
        key: `${id}-${value}`,
        label: labelFor(id, value),
        remove: () => toggleFilter(id, value)
      }))
    ),
    ...asList(params.tags).map((tag) => ({
      key: `tag-${tag}`,
      label: `Tag: ${tag}`,
      remove: () =>
        navigate({ tags: asList(params.tags).filter((t) => t !== tag) })
    })),
    ...(params.owner
      ? [
          {
            key: 'owner',
            label: `Publisher: ${accountTruncate(params.owner as string)}`,
            remove: () => navigate({ owner: undefined })
          }
        ]
      : [])
  ]
  const filterCount = chips.length

  function clearAll() {
    setText('')
    navigate({
      accessType: undefined,
      priceType: undefined,
      supportedBlockchain: undefined,
      tags: undefined,
      owner: undefined,
      text: undefined,
      serviceType: undefined,
      sort: params.sort === Relevance ? undefined : (params.sort as string),
      sortOrder:
        params.sort === Relevance ? undefined : (params.sortOrder as string)
    })
  }

  const activeType = asList(params.serviceType)
  const activeTab = activeType.length === 1 ? activeType[0] : ''
  const hasText = Boolean(params.text && String(params.text).trim())
  const currentSort = sortKey(
    (params.sort as string) || (hasText ? Relevance : Created),
    (params.sortOrder as string) || DESC
  )
  const sortOptions = SORT_OPTIONS.filter(
    (o) => o.sort !== Relevance || hasText
  )

  const total = queryResult?.totalResults
  const tooMany =
    (queryResult?.totalPages || 0) > MAXIMUM_NUMBER_OF_PAGES_WITH_RESULTS

  const emptyState = (
    <div className={styles.empty}>
      <span
        className={`material-symbols-rounded ${styles.emptyIcon}`}
        aria-hidden="true"
      >
        search_off
      </span>
      <h2 className={styles.emptyTitle}>
        {hasText
          ? `No results for “${String(params.text).trim()}”`
          : 'No results'}
      </h2>
      <p className={styles.emptyText}>
        Try another search term or remove some filters.
      </p>
      {(hasText || filterCount > 0 || activeTab) && (
        <button
          type="button"
          className={styles.primaryButton}
          onClick={clearAll}
        >
          Clear search and filters
        </button>
      )}
    </div>
  )

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Catalogue</h1>
          <p className={styles.subtitle}>
            Datasets and algorithms shared on Open Dataspace Lab.
          </p>
          <form
            className={styles.search}
            role="search"
            onSubmit={(e) => {
              e.preventDefault()
              applyText.flush()
            }}
          >
            <span
              className={`material-symbols-rounded ${styles.searchIcon}`}
              aria-hidden="true"
            >
              search
            </span>
            <input
              id="catalogue-search"
              type="search"
              className={styles.searchInput}
              placeholder="Search datasets, algorithms, tags or publishers"
              aria-label="Search the catalogue"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                applyText(e.target.value)
              }}
            />
            {text && (
              <button
                type="button"
                className={styles.clearSearch}
                aria-label="Clear search"
                onClick={() => {
                  setText('')
                  applyText('')
                  applyText.flush()
                }}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  close
                </span>
              </button>
            )}
          </form>
          <div className={styles.tabs} role="tablist" aria-label="Asset type">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                className={
                  activeTab === tab.value ? styles.tabActive : undefined
                }
                onClick={() =>
                  navigate({ serviceType: tab.value || undefined })
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.body}>
          <aside
            className={`${styles.sidebar} ${
              drawerOpen ? styles.drawerOpen : ''
            }`}
            aria-label="Filters"
          >
            <div className={styles.drawerHead}>
              <h2 className={styles.drawerTitle}>Filters</h2>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Close filters"
                onClick={() => setDrawerOpen(false)}
              >
                <span className="material-symbols-rounded" aria-hidden="true">
                  close
                </span>
              </button>
            </div>
            <FilterPanel
              params={params}
              chainOptions={chainOptions}
              onToggle={toggleFilter}
              onClear={() =>
                navigate({
                  accessType: undefined,
                  priceType: undefined,
                  supportedBlockchain: undefined
                })
              }
              activeCount={
                asList(params.accessType).length +
                asList(params.priceType).length +
                asList(params.supportedBlockchain).length
              }
            />
            <button
              type="button"
              className={`${styles.primaryButton} ${styles.drawerDone}`}
              onClick={() => setDrawerOpen(false)}
            >
              {loading
                ? 'Show results'
                : `Show ${total ?? 0} result${total === 1 ? '' : 's'}`}
            </button>
          </aside>
          {drawerOpen && (
            <div
              className={styles.backdrop}
              aria-hidden="true"
              onClick={() => setDrawerOpen(false)}
            />
          )}

          <section className={styles.results} aria-label="Results">
            <div className={styles.toolbar}>
              <p className={styles.count} aria-live="polite">
                {loading
                  ? 'Searching…'
                  : tooMany
                  ? 'More than 10,000 results, refine your search'
                  : `${total ?? 0} result${total === 1 ? '' : 's'}`}
              </p>
              <div className={styles.toolbarRight}>
                <button
                  type="button"
                  className={styles.filtersButton}
                  onClick={() => setDrawerOpen(true)}
                >
                  <span className="material-symbols-rounded" aria-hidden="true">
                    tune
                  </span>
                  Filters{filterCount > 0 ? ` (${filterCount})` : ''}
                </button>
                <label className={styles.sortLabel} htmlFor="catalogue-sort">
                  Sort
                </label>
                <select
                  id="catalogue-sort"
                  className={styles.sortSelect}
                  value={currentSort}
                  onChange={(e) => {
                    const [sort, sortOrder] = e.target.value.split('|')
                    navigate({ sort, sortOrder })
                  }}
                >
                  {sortOptions.map((o) => (
                    <option key={o.label} value={sortKey(o.sort, o.order)}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <AssetViewSelector
                  activeView={assetView}
                  onViewChange={setAssetView}
                  className={styles.viewToggle}
                />
              </div>
            </div>

            {filterCount > 0 && (
              <div className={styles.chips}>
                {chips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    className={styles.chip}
                    onClick={chip.remove}
                    aria-label={`Remove filter ${chip.label}`}
                  >
                    {chip.label}
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
            )}

            <AssetList
              assets={queryResult?.results}
              showPagination
              isLoading={loading}
              page={queryResult?.page}
              totalPages={queryResult?.totalPages}
              onPageChange={updatePage}
              defaultAssetView={assetView}
              skeletonCount={6}
              emptyState={emptyState}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
