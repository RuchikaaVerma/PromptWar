import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SVES | Aether Command Center — Smart Venue Experience System',
  description: 'Real-time stadium crowd management, AI-driven route optimization, and enterprise telemetry powered by Google Gemini AI, Firebase Analytics, and Google Maps. Built for high-stakes venue operations.',
  keywords: ['smart stadium', 'crowd management', 'AI routing', 'Firebase', 'Gemini AI', 'venue intelligence'],
  authors: [{ name: 'SVES Operations Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'SVES | Aether Command Center',
    description: 'Enterprise stadium intelligence platform with real-time AI routing and Google Firebase telemetry.',
    type: 'website',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#00FFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* HUD atmospheric overlays */}
        <div className="hud-scanline" aria-hidden="true" />
        <div className="hud-grain"    aria-hidden="true" />
        <main className="app-container">
          {children}
        </main>
      </body>
    </html>
  )
}
