'use client'

import { useState, useEffect } from 'react'
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

interface CostData {
  date: string
  airtable_api_calls: number
  claude_api_calls: number
  github_actions_minutes: number
  cloudflare_requests: number
  estimated_total_cost: number
}

interface UsageSummary {
  current_month: {
    airtable_calls: number
    claude_calls: number
    github_minutes: number
    total_cost: number
  }
  previous_month: {
    airtable_calls: number
    claude_calls: number
    github_minutes: number
    total_cost: number
  }
  free_tier_limits: {
    airtable_calls: number
    github_minutes: number
  }
}

export default function Costs() {
  const [costData, setCostData] = useState<CostData[]>([])
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCostData()
  }, [])

  const fetchCostData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/costs')
      if (!response.ok) throw new Error('Failed to fetch cost data')
      
      const data = await response.json()
      setCostData(data.costs || [])
      setSummary(data.summary || null)
    } catch (err) {
      setError('Failed to load cost data')
      console.error('Error fetching cost data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-danger-600 bg-danger-100'
    if (percentage >= 75) return 'text-warning-600 bg-warning-100'
    return 'text-success-600 bg-success-100'
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, direction: 'neutral' }
    const change = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Cost Monitoring
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Track API usage and estimated costs across all services
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchCostData}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="card">
          <div className="flex items-center text-danger-600">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Cost Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Monthly Cost</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary?.current_month.total_cost)}
                    </div>
                    {summary?.previous_month.total_cost > 0 && (
                      <div className="ml-2 flex items-baseline text-sm">
                        {(() => {
                          const change = calculateChange(
                            summary?.current_month.total_cost,
                            summary?.previous_month.total_cost
                          )
                          return (
                            <span className={`flex items-center ${
                              change.direction === 'up' ? 'text-danger-600' : 
                              change.direction === 'down' ? 'text-success-600' : 'text-gray-500'
                            }`}>
                              {change.direction === 'up' && <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />}
                              {change.direction === 'down' && <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />}
                              {change.percentage.toFixed(1)}%
                            </span>
                          )
                        })()}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Airtable Calls</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {summary?.current_month.(airtable_calls || 0).toLocaleString()}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {getUsagePercentage(summary?.current_month.airtable_calls, summary?.free_tier_limits.airtable_calls).toFixed(1)}% of free tier
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Claude Calls</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {summary?.current_month.(claude_calls || 0).toLocaleString()}
                  </dd>
                  <dd className="text-xs text-gray-500">Pay-per-use</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">GitHub Minutes</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {summary?.current_month.(github_minutes || 0).toLocaleString()}
                  </dd>
                  <dd className="text-xs text-gray-500">
                    {getUsagePercentage(summary?.current_month.github_minutes, summary?.free_tier_limits.github_minutes).toFixed(1)}% of free tier
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Tier Usage */}
      {summary && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Free Tier Usage</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Airtable API Calls</span>
                <span className="text-gray-900 font-medium">
                  {summary?.current_month.(airtable_calls || 0).toLocaleString()} / {summary?.free_tier_limits.(airtable_calls || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${getUsagePercentage(summary?.current_month.airtable_calls, summary?.free_tier_limits.airtable_calls)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      getUsagePercentage(summary?.current_month.airtable_calls, summary?.free_tier_limits.airtable_calls) >= 90 
                        ? 'bg-danger-500' 
                        : getUsagePercentage(summary?.current_month.airtable_calls, summary?.free_tier_limits.airtable_calls) >= 75 
                        ? 'bg-warning-500' 
                        : 'bg-success-500'
                    }`}
                  ></div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">GitHub Actions Minutes</span>
                <span className="text-gray-900 font-medium">
                  {summary?.current_month.(github_minutes || 0).toLocaleString()} / {summary?.free_tier_limits.(github_minutes || 0).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 relative">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${getUsagePercentage(summary?.current_month.github_minutes, summary?.free_tier_limits.github_minutes)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      getUsagePercentage(summary?.current_month.github_minutes, summary?.free_tier_limits.github_minutes) >= 90 
                        ? 'bg-danger-500' 
                        : getUsagePercentage(summary?.current_month.github_minutes, summary?.free_tier_limits.github_minutes) >= 75 
                        ? 'bg-warning-500' 
                        : 'bg-success-500'
                    }`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Cost Data */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Usage</h3>
        {costData.length === 0 ? (
          <p className="text-sm text-gray-500">No cost data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Airtable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Claude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GitHub
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {costData.slice(-10).map((row, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.airtable_api_calls} calls
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.claude_api_calls} calls
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row.github_actions_minutes} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(row.estimated_total_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}