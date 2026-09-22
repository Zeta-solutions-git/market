import { ReactElement } from 'react'
import Link from 'next/link'
import Page from '@shared/Page'
import contentStyles from '@shared/SiteLayout/content.module.css'
import { useRouter } from 'next/router'

export default function Page404(): ReactElement {
  const router = useRouter()

  return (
    <Page
      title="Page not found"
      description="The page you are looking for could not be found."
      uri={router.route}
      noPageHeader
      fullWidth
    >
      <section
        className={`${contentStyles.section} ${contentStyles.sectionAlt} ${contentStyles.notFound}`}
        aria-label="Page not found"
      >
        <div className={contentStyles.sectionInner}>
          <div className={contentStyles.comingSoon}>
            <span
              className={`material-symbols-rounded ${contentStyles.comingSoonIcon}`}
              aria-hidden="true"
            >
              sentiment_dissatisfied
            </span>
            <h1 className={contentStyles.notFoundTitle}>Page not found</h1>
            <p className={contentStyles.comingSoonText}>
              The page you&apos;re looking for doesn&apos;t exist or may have
              moved.
            </p>
            <Link href="/" className={contentStyles.notFoundHome}>
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </Page>
  )
}
