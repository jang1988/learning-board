import FloatingBackground from '@/components/layout/FloatingBackground'
import '@/styles/globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'SPECIALIST — Платформа навчання',
	description: 'Система адаптації та навчання нових співробітників',
	icons: {
		icon: '/icon0.svg',
		apple: '/apple-icon.png'
	}
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		 <html lang="uk">
      <body>
        <FloatingBackground />

        <main className="app-content">
          {children}
        </main>
      </body>
    </html>
	)
}
