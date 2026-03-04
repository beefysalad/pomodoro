import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'
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
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
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
          fontFamily: 'var(--font-geist-mono)',
        },
        elements: {
          cardBox: 'shadow-none',
          card: 'bg-transparent border-none shadow-none',
          headerTitle: 'text-foreground font-[800] tracking-[-0.03em]',
          headerSubtitle: 'text-text-sub font-[400]',
          socialButtonsBlockButton:
            'bg-surface-up border-border hover:bg-surface-hi transition-all text-foreground font-[600] rounded-[7px]',
          socialButtonsBlockButtonText: 'font-[600]',
          dividerLine: 'bg-border',
          dividerText:
            'text-muted-foreground font-[600] tracking-[0.1em] uppercase',
          formFieldLabel:
            'text-muted-foreground font-[600] tracking-[0.1em] uppercase text-[10px]',
          formFieldInput:
            'bg-surface border-border text-foreground rounded-[7px] text-[13px] font-[400] focus:border-violet-mid focus:ring-1 focus:ring-violet-glow',
          formButtonPrimary:
            'bg-violet hover:bg-violet/90 border border-violet text-white font-[600] rounded-[7px] shadow-[0_0_16px_var(--color-violet-glow)] transition-all',
          footerActionText: 'text-text-sub',
          footerActionLink:
            'text-violet-mid hover:text-violet transition-colors',
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
              {children}
              <Toaster richColors position="bottom-center" />
            </QueryProvider>
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
