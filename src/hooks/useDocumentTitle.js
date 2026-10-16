import { useEffect } from 'react'

const SITE_NAME = 'Book & Table'

export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  }, [title])
}
