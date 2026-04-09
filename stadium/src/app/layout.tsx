import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Velocity Arena - Smart Stadium',
  description: 'Interactive smart stadium experience with crowd control and express ordering',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  )
}
