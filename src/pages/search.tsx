import { ReactElement, useState } from 'react'
import Search from '../components/Search'
import Page from '@shared/Page'
import { useRouter } from 'next/router'

export default function PageSearch(): ReactElement {
  const router = useRouter()
  // the catalogue renders its own header (title, search, result count)
  const [, setTotalResults] = useState<number>()
  const [, setTotalPagesNumber] = useState<number>()

  return (
    <Page
      title="Catalogue"
      description="Datasets and algorithms shared on Open Dataspace Lab."
      uri={router.route}
      noPageHeader
      fullWidth
    >
      <Search
        setTotalResults={setTotalResults}
        setTotalPagesNumber={setTotalPagesNumber}
      />
    </Page>
  )
}
