'use client'

import { useState, useEffect } from 'react'
import { 
  CurrencyDollarIcon, 
  ChartBarIcon, 
  ServerIcon,
  CloudIcon
} from '@heroicons/react/24/outline'

interface CostData {
  date: string
  supabase_api_calls: number
  vercel_deployments: number
  agent_executions: number
  control_tower_requests: number
  estimated_total_cost: number
}

interface CostSummary {
  current_month: {
    supabase_calls: number
    vercel_deployments: number
    agent_executions: number
    control_tower_requests: number
    total_cost: number
  }
  previous_month: {
    supabase_calls: number
    vercel_deployments: number
    agent_executions: number
    control_tower_requests: number
    total_cost: number
  }
  current_services: {
    control_tower: string
    coo_agent: string
    architecture_monitoring: string
    kpi_alerts: string
  }
  service_limits: {
    supabase_free_tier: number
    vercel_free_tier: number
    github_actions_minutes: number
  }
}

export default function CostsPage() {
  const [costs, setCosts] = useState<CostData[]>([])
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCosts()
  }, [])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/costs')
      if (!response.ok) throw new Error('Failed to fetch costs')
      
      const data = await response.json()
      setCosts(data.costs || [])
      setSummary(data.summary || null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Error loading costs</h3>
            <p className="mt-2">{error}</p>
          </div>
        </div>
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
            Track usage and costs across all services
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Current Month Cost
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${(summary?.current_month?.total_cost || 0).toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ServerIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Supabase Calls
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(summary?.current_month?.supabase_calls || 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CloudIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Vercel Deployments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(summary?.current_month?.vercel_deployments || 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Agent Executions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(summary?.current_month?.agent_executions || 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      {summary?.current_services && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Current Services
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.current_services).map(([service, status]) => (
                <div key={service} className="text-center">
                  <div className="text-sm font-medium text-gray-500 capitalize">
                    {service.replace('_', ' ')}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      {summary && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Monthly Comparison
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Current Month</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Cost:</span>
                    <span className="text-sm font-medium">${(summary?.current_month?.total_cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Supabase Calls:</span>
                    <span className="text-sm font-medium">{(summary?.current_month?.supabase_calls || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Deployments:</span>
                    <span className="text-sm font-medium">{(summary?.current_month?.vercel_deployments || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-md font-medium text-gray-700 mb-2">Previous Month</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Cost:</span>
                    <span className="text-sm font-medium">${(summary?.previous_month?.total_cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Supabase Calls:</span>
                    <span className="text-sm font-medium">{(summary?.previous_month?.supabase_calls || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Deployments:</span>
                    <span className="text-sm font-medium">{(summary?.previous_month?.vercel_deployments || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}