import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amphelo Health — Healthcare, handled for you',
  description: 'Automated prescription management and care coordination powered by AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
