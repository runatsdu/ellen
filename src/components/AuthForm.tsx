import React, { useState } from 'react'
import { Mail, Loader2, CheckCircle, AlertCircle, Settings, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AuthFormProps {
  onSuccess?: () => void
  onFakeLogin?: (email: string) => void
}

export default function AuthForm({ onSuccess, onFakeLogin }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState<'password' | 'magiclink'>('password')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDevMode, setShowDevMode] = useState(false)

  const isDevelopment = import.meta.env.DEV

  const handleFakeLogin = (fakeEmail: string) => {
    onFakeLogin?.(fakeEmail)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      return
    }

    if (authMode === 'password' && !password) {
      setMessage({ type: 'error', text: 'Please enter your password' })
      return
    }

    if (authMode === 'password' && password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      if (authMode === 'magiclink') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          setMessage({
            type: 'success',
            text: 'Check your email for the magic link to sign in!'
          })
          setEmail('')
          onSuccess?.()
        }
      } else {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) {
            setMessage({ type: 'error', text: error.message })
          } else {
            setMessage({
              type: 'success',
              text: 'Account created successfully! You are now logged in.'
            })
            onSuccess?.()
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            setMessage({ type: 'error', text: error.message })
          } else {
            onSuccess?.()
          }
        }
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full mb-4">
            {authMode === 'magiclink' ? (
              <Mail className="w-8 h-8 text-white" />
            ) : (
              <Lock className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {authMode === 'magiclink'
              ? 'Welcome'
              : isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {authMode === 'magiclink'
              ? 'Sign in with a magic link'
              : isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setAuthMode('password')
              setMessage(null)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authMode === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1.5" />
            Password
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('magiclink')
              setMessage(null)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              authMode === 'magiclink'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-1.5" />
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-11"
                disabled={loading}
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {authMode === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-11"
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          )}

          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{message.text}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {authMode === 'magiclink'
                  ? 'Sending magic link...'
                  : isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {authMode === 'magiclink' ? (
                  <Mail className="w-5 h-5" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {authMode === 'magiclink'
                  ? 'Send Magic Link'
                  : isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {authMode === 'password' && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage(null)
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        )}

        {authMode === 'magiclink' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              No password required. We'll send you a secure link to sign in.
            </p>
          </div>
        )}

        {isDevelopment && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => setShowDevMode(!showDevMode)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mx-auto"
            >
              <Settings className="w-4 h-4" />
              Development Mode
            </button>
            
            {showDevMode && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">Quick login for testing:</p>
                <div className="grid gap-2">
                  <button
                    type="button"
                    onClick={() => handleFakeLogin('teacher1@school.edu')}
                    className="w-full px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Login as Teacher 1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFakeLogin('teacher2@school.edu')}
                    className="w-full px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    Login as Teacher 2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFakeLogin('admin@school.edu')}
                    className="w-full px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    Login as Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFakeLogin('student@school.edu')}
                    className="w-full px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Login as Student (Non-teacher)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}