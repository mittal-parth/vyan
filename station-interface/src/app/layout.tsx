import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Battery Swap Station',
  description: 'Station interface for battery swap operations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
