import { useCallback, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError(null)
      setIsLoading(true)

      const result = await signIn(email, password)

      if (!result.success) {
        setError(result.error ?? 'Sign in failed')
        setIsLoading(false)
        return
      }

      navigate(from, { replace: true })
    },
    [email, from, navigate, password, signIn],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Authenticate with Supabase to access Neocloud.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            handleSubmit(event).catch(console.error)
          }}
          className="space-y-6"
        >
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
              }}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/auth/forgot-password" className="text-sm underline underline-offset-4 hover:text-primary">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/auth/signup" className="underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
