import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'
import { TimerProvider } from './providers/timer-provider'
import { dark } from '@clerk/themes'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#7C3AED',
          colorBackground: '#111827',
          colorInputBackground: '#111827',
          colorInputText: '#E2E8F0',
          colorTextOnPrimaryBackground: '#ffffff',
          colorText: '#E2E8F0',
          colorTextSecondary: '#94A3B8',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <TimerProvider>
                {children}
                <Toaster
                  position="bottom-center"
                  expand
                  visibleToasts={4}
                  closeButton
                  toastOptions={{
                    classNames: {
                      toast: 'tempo-toast',
                      title: 'tempo-toast-title',
                      description: 'tempo-toast-description',
                      actionButton: 'tempo-toast-action',
                      cancelButton: 'tempo-toast-cancel',
                      closeButton: 'tempo-toast-close',
                      success: 'tempo-toast-success',
                      error: 'tempo-toast-error',
                      info: 'tempo-toast-info',
                      warning: 'tempo-toast-warning',
                      loading: 'tempo-toast-loading',
                    },
                  }}
                />
              </TimerProvider>
            </QueryProvider>
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
