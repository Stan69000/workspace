import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenu-principal" className="skip-link">
        Aller au contenu principal
      </a>
      <Navbar />
      <main id="contenu-principal" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  )
}
