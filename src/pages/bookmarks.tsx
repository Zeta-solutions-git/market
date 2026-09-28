import { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'

// Bookmarks moved into the profile page (Bookmarks section). Keep old links working.
export default function PageBookmarks(): ReactElement {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile?section=bookmarks')
  }, [router])
  return null
}
