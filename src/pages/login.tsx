import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Demo password - change this for your client
    if (password === 'hewitt2025') {
      try {
        // Set authentication cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'demo-auth=authenticated; path=/; max-age=86400' // 24 hours
        }
        await router.push('/')
      } catch (error) {
        console.error('Login error:', error)
        setError('Login failed')
      }
    } else {
      setError('Invalid password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">EdAccessPro</h1>
          <p className="text-gray-600">Private Demo Access</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Demo Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter demo password"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Authenticating...' : 'Access Demo'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          Demo password: <code className="bg-gray-100 px-2 py-1 rounded">hewitt2025</code>
        </div>
      </div>
    </div>
  )
}