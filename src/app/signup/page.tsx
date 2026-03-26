import Link from 'next/link'
import { signup } from '@/app/auth/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const resolvedSearchParams = await searchParams
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <form className="flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={signup}>
        <h1 className="text-2xl font-semibold text-center mb-6">Create Account</h1>
        
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button className="bg-green-600 text-white rounded-md px-4 py-2 text-foreground mb-2">
          Sign Up
        </button>
        <p className="text-sm text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>

        {resolvedSearchParams?.message && (
          <p className="mt-4 p-4 bg-red-100 text-red-600 text-center rounded-md">
            {resolvedSearchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
