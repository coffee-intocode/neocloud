import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const { updatePassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setError(null)

      if (password.length < 8) {
        setError('Password must be at least 8 characters')
        return
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      setIsLoading(true)
      const result = await updatePassword(password)
      setIsLoading(false)

      if (!result.success) {
        setError(result.error ?? 'Unable to update password')
        return
      }

      navigate('/', { replace: true })
    },
    [confirmPassword, navigate, password, updatePassword],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Set a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(event) => {
            handleSubmit(event).catch(console.error)
          }}
          className="space-y-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
              }}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
