import Footer from '../components/Footer'
import SiteNav from '../components/SiteNav'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ContentPage({ title, children }) {
  useDocumentTitle(title)

  return (
    <div>
      <header className="page-header">
        <h1>{title}</h1>
      </header>
      <SiteNav />
      <main className="inner-main">
        <article className="prose inner-prose">{children}</article>
      </main>
      <Footer />
    </div>
  )
}
