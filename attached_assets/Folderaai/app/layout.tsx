import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Foldera - The AI That Never Ghosts You',
  description: 'When other AIs vanish at crunch time, Foldera stands guard. Preventing disasters. Protecting careers. Before it\'s too late.',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}