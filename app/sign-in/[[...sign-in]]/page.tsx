import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <SignIn />
    </div>
  )
}
