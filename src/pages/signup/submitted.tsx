import { ReactElement } from 'react'
import { useRouter } from 'next/router'
import Page from '@shared/Page'
import SignupSubmitted from '../../components/pages/SignupSubmitted'

export default function PageSignupSubmitted(): ReactElement {
  const router = useRouter()

  return (
    <Page
      title="Application received"
      description="Your Open Dataspace Lab account is being reviewed."
      uri={router.route}
      noPageHeader
      fullWidth
    >
      <SignupSubmitted />
    </Page>
  )
}
