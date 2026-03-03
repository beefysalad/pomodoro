import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-4">
      <SignUp />
    </div>
  )
}
