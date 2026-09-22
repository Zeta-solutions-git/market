import { ReactElement } from 'react'
import Contact from '../components/pages/Contact'
import Page from '@shared/Page'
import { useRouter } from 'next/router'

export default function ContactPage(): ReactElement {
  const router = useRouter()
  return (
    <Page
      title="Contact"
      description="Get in touch to join the dataspace, share a dataset, or explore a use case."
      uri={router.asPath}
      noPageHeader
      fullWidth
    >
      <Contact />
    </Page>
  )
}
