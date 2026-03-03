import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { SessionProvider } from 'next-auth/react'
import { Analytics } from '@vercel/analytics/next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Tempo',
  description:
    'Tempo is a gamified study planner built around a structured Pomodoro system. Users organize their study material into Subjects containing Topics, then launch focused timer sessions on individual topics. Progress is tracked via XP, levels, session history, and a daily streak system.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
          >
            <SessionProvider>
              <QueryProvider>
                {children}
                <Toaster richColors position="bottom-center" />
              </QueryProvider>
              <Analytics />
            </SessionProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
