import { ReactElement } from 'react'
import TheTeam from '../components/pages/TheTeam'
import Page from '@shared/Page'
import { useRouter } from 'next/router'

export default function TheTeamPage(): ReactElement {
  const router = useRouter()
  return (
    <Page
      title="The Team"
      description="The engineers, data architects, and domain experts behind the dataspace."
      uri={router.asPath}
      noPageHeader
      fullWidth
    >
      <TheTeam />
    </Page>
  )
}
