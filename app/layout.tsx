import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from './providers/theme-provider'
import { TimerProvider } from './providers/timer-provider'
import { dark, shadcn } from '@clerk/themes'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { TutorialAutoStart } from '@/components/tutorial-auto-start'

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
        baseTheme: [shadcn, dark],
        variables: {
          colorPrimary: '#7C3AED',
          colorBackground: '#070b16',
          colorNeutral: '#1f2937',
          colorInputBackground: '#111a2d',
          colorInputText: '#E2E8F0',
          colorTextOnPrimaryBackground: '#ffffff',
          colorText: '#f1f5f9',
          colorTextSecondary: '#cbd5e1',
          borderRadius: '0.75rem',
        },
        elements: {
          card: 'shadow-2xl border border-white/12 bg-[#0d1628]/96 backdrop-blur-xl',
          headerTitle: 'text-white tracking-tight',
          headerSubtitle: 'text-slate-300',
          formFieldLabel: 'text-slate-200',
          formFieldInputShowPasswordButton: 'text-slate-300 hover:text-white',
          formFieldInput:
            'border border-white/15 bg-white/8 text-slate-100 placeholder:text-slate-400',
          identityPreviewText: 'text-slate-100',
          identityPreviewEditButton: 'text-cyan-300 hover:text-cyan-200',
          formButtonPrimary:
            'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_24px_rgba(124,58,237,0.35)]',
          socialButtonsBlockButton:
            'border border-white/15 bg-white/8 text-slate-100 hover:bg-white/14',
          socialButtonsBlockButtonText: 'text-slate-100',
          socialButtonsProviderIcon: 'opacity-100',
          dividerLine: 'bg-white/10',
          dividerText: 'text-slate-400',
          formResendCodeLink: 'text-cyan-300 hover:text-cyan-200',
          otpCodeFieldInput: 'border border-white/15 bg-white/8 text-slate-100',
          footer: 'border-t border-white/10 bg-[#0d1628]/96 text-slate-300',
          footerAction: 'text-slate-300',
          footerActionLink: 'text-cyan-300 hover:text-cyan-200',
          formFieldSuccessText: 'text-emerald-300',
          formFieldWarningText: 'text-amber-300',
          formFieldErrorText: 'text-red-300',
          userButtonPopoverCard:
            'border border-white/10 bg-[#0b1220]/95 text-slate-100 shadow-2xl backdrop-blur-xl',
          userButtonPopoverActionButton:
            'text-slate-200 hover:bg-white/10 hover:text-white',
          userButtonPopoverActionButtonText: 'text-slate-200',
          userButtonPopoverFooter: 'hidden',
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
                <TutorialAutoStart />
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
