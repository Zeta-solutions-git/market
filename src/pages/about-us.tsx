import { ReactElement } from 'react'
import AboutUs from '../components/pages/AboutUs'
import Page from '@shared/Page'
import { useRouter } from 'next/router'

export default function AboutUsPage(): ReactElement {
  const router = useRouter()
  return (
    <Page
      title="About us"
      description="A sovereign marketplace for data and AI, built on Gaia-X principles."
      uri={router.asPath}
      noPageHeader
      fullWidth
    >
      <AboutUs />
    </Page>
  )
}
