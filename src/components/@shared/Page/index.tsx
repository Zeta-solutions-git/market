import { ReactNode, ReactElement } from 'react'
import PageHeader from './PageHeader'
import Seo from './Seo'
import Container from '@shared/atoms/Container'
import styles from './index.module.css'

interface PageProps {
  children: ReactNode
  title?: string
  uri: string
  description?: string
  noPageHeader?: boolean
  headerCenter?: boolean
  fullWidth?: boolean
}

export default function Page({
  children,
  title,
  uri,
  description,
  noPageHeader,
  headerCenter,
  fullWidth
}: PageProps): ReactElement {
  const isHome = uri === '/'
  // const isSearchPage = uri.startsWith('/search')
  const mainStyle = fullWidth
    ? { display: 'flex', flex: 1, minHeight: 0 }
    : undefined

  return (
    <>
      <Seo title={title} description={description} uri={uri} />

      {/* Header section - always wrapped in Container except for home page */}
      {!isHome && (
        <Container>
          {/* <SearchBar
            placeholder="Search for service offerings"
            isSearchPage={isSearchPage}
          /> */}
          {/* asset pages show the external-content notice next to the
              description itself (AssetContent), only when it's relevant */}
          {title && !noPageHeader && (
            <PageHeader center={headerCenter} isHome={isHome} />
          )}
        </Container>
      )}

      {/* Main content - full width for home, contained for others */}
      <main
        className={isHome || fullWidth ? 'full-width' : ''}
        style={mainStyle}
      >
        {isHome || fullWidth ? (
          children
        ) : (
          <Container className={styles.contentContainer}>{children}</Container>
        )}
      </main>
    </>
  )
}
