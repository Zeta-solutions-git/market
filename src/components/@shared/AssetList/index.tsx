import AssetTeaser from '@shared/AssetTeaser'
import { ReactElement, ReactNode } from 'react'
import Pagination from '@shared/Pagination'
import styles from './index.module.css'
import { AssetViewOptions } from 'src/@types/AssetView'
import { AssetExtended } from 'src/@types/AssetExtended'
import Alert from '../atoms/Alert'
import AssetListSkeleton, { AssetListTableSkeleton } from './Skeleton'

declare type AssetListProps = {
  assets: AssetExtended[]
  showPagination: boolean
  page?: number
  totalPages?: number
  isLoading?: boolean
  onPageChange?: React.Dispatch<React.SetStateAction<number>>
  className?: string
  noPublisher?: boolean
  noDescription?: boolean
  noPrice?: boolean
  defaultAssetView?: AssetViewOptions
  skeletonCount?: number
  // shown instead of the default "No results found" notice
  emptyState?: ReactNode
}

export default function AssetList({
  assets,
  showPagination,
  page,
  totalPages,
  isLoading,
  onPageChange,
  className,
  noPublisher,
  noDescription,
  noPrice,
  defaultAssetView,
  skeletonCount = 21,
  emptyState
}: AssetListProps): ReactElement {
  const activeAssetView = defaultAssetView || AssetViewOptions.Grid

  // This changes the page field inside the query
  function handlePageChange(selected: number) {
    onPageChange(selected + 1)
  }

  const styleClasses = `${styles.assetList} ${className || ''}`

  if (isLoading) {
    return activeAssetView === AssetViewOptions.List ? (
      <AssetListTableSkeleton />
    ) : (
      <AssetListSkeleton
        count={skeletonCount}
        noPublisher={noPublisher}
        noDescription={noDescription}
      />
    )
  }

  if (!assets?.length || assets[0] === undefined) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <Alert warning>No results found</Alert>
    )
  }

  return (
    <>
      {activeAssetView === AssetViewOptions.List ? (
        <div className={styles.listViewWrapper}>
          <div className={styles.rowList}>
            {assets.map((asset) =>
              asset?.indexedMetadata && asset?.credentialSubject ? (
                <AssetTeaser
                  asset={asset}
                  key={asset.id}
                  variant="row"
                  noPublisher={noPublisher}
                  noDescription={noDescription}
                  noPrice={noPrice}
                />
              ) : null
            )}
          </div>
          {showPagination && (
            <Pagination
              totalPages={totalPages}
              currentPage={page}
              onChangePage={handlePageChange}
            />
          )}
        </div>
      ) : (
        <>
          <div className={styleClasses}>
            {assets.map((asset) => {
              if (asset?.indexedMetadata && asset?.credentialSubject) {
                return (
                  <AssetTeaser
                    asset={asset}
                    key={asset.id}
                    noPublisher={noPublisher}
                    noDescription={noDescription}
                    noPrice={noPrice}
                  />
                )
              }
              return null
            })}
          </div>
          {showPagination && (
            <Pagination
              totalPages={totalPages}
              currentPage={page}
              onChangePage={handlePageChange}
            />
          )}
        </>
      )}
    </>
  )
}
