import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#060a14] px-4 py-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-160px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-500/14 blur-[170px]" />
        <div className="absolute left-[-140px] bottom-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[150px]" />
      </div>
      <div className="relative z-10">
        <SignUp />
      </div>
    </div>
  )
}
