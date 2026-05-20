import type { ReactNode } from 'react'
import Navbar from './Navbar'

interface LayoutProps {
  children: ReactNode
  /** Si true, shows full height without extra container */
  fullPage?: boolean
}

export default function Layout({ children, fullPage }: LayoutProps) {
  return (
    <>
      <Navbar />
      {fullPage ? children : (
        <main className="container page">
          {children}
        </main>
      )}
    </>
  )
}
