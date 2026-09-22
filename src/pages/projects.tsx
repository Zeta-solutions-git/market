import { ReactElement } from 'react'
import Projects from '../components/pages/Projects'
import Page from '@shared/Page'
import { useRouter } from 'next/router'

export default function ProjectsPage(): ReactElement {
  const router = useRouter()
  return (
    <Page
      title="Projects"
      description="Cross-sector dataspaces we are building with public and private partners."
      uri={router.asPath}
      noPageHeader
      fullWidth
    >
      <Projects />
    </Page>
  )
}
