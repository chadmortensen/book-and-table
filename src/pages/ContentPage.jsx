import Footer from '../components/Footer'
import SiteHeader from '../components/SiteHeader'
import SiteNav from '../components/SiteNav'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function ContentPage({ title, children }) {
  useDocumentTitle(title)

  return (
    <div>
      <SiteHeader />
      <SiteNav />
      <main className="inner-main">
        <article className="prose inner-prose">{children}</article>
      </main>
      <Footer />
    </div>
  )
}
