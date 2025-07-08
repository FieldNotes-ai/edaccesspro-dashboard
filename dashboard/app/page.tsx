'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  CircleStackIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

interface KPIData {
  date: string
  completeness_pct: number
  conflict_pct: number
  mean_latency_min: number
}

interface WorkflowStatus {
  name: string
  status: 'success' | 'failure' | 'in_progress' | 'unknown'
  lastRun: string
  conclusion?: string
}

interface SystemStatus {
  kpis: KPIData[]
  workflows: WorkflowStatus[]
  changeReviewCount: number
  prodBaseId: string
  stagingBaseId: string
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    success: 'status-success',
    failure: 'status-danger',
    in_progress: 'status-warning',
    unknown: 'status-info'
  }
  
  const icons = {
    success: CheckCircleIcon,
    failure: ExclamationTriangleIcon,
    in_progress: ClockIcon,
    unknown: ClockIcon
  }
  
  const Icon = icons[status as keyof typeof icons] || ClockIcon
  
  return (
    <span className={styles[status as keyof typeof styles] || 'status-info'}>
      <Icon className="h-3 w-3 mr-1" />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

function KPICard({ title, value, unit, status, icon: Icon }: {
  title: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'danger'
  icon: any
}) {
  const statusColors = {
    good: 'text-success-600',
    warning: 'text-warning-600',
    danger: 'text-danger-600'
  }
  
  return (
    <div className="card">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${statusColors[status]}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className={`text-2xl font-semibold ${statusColors[status]}`}>
                {value.toFixed(1)}{unit}
              </div>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Temporarily disable authentication to fix redirect loop
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const response = await fetch('/api/auth/login', {
  //         method: 'GET',
  //         credentials: 'include'
  //       })
  //       
  //       if (!response.ok) {
  //         router.push('/login')
  //         return
  //       }
  //     } catch (err) {
  //       router.push('/login')
  //       return
  //     }
  //   }
  //   checkAuth()
  // }, [router])

  useEffect(() => {
    async function fetchSystemStatus() {
      try {
        setLoading(true)
        
        // Fetch KPI data
        const kpiResponse = await fetch('/api/kpis')
        const kpiData = await kpiResponse.json()
        
        // Fetch workflow status
        const workflowResponse = await fetch('/api/workflows')
        const workflowData = await workflowResponse.json()
        
        // Fetch change review count
        const changeReviewResponse = await fetch('/api/change-review/count')
        const changeReviewData = await changeReviewResponse.json()
        
        // Fetch base IDs
        const baseIdsResponse = await fetch('/api/base-ids')
        const baseIdsData = await baseIdsResponse.json()
        
        setSystemStatus({
          kpis: kpiData.kpis || [],
          workflows: workflowData.workflows || [],
          changeReviewCount: changeReviewData.count || 0,
          prodBaseId: baseIdsData.production || 'Unknown',
          stagingBaseId: baseIdsData.staging || 'Unknown'
        })
      } catch (err) {
        setError('Failed to fetch system status')
        console.error('Error fetching system status:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSystemStatus()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSystemStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex items-center text-danger-600">
          <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  const latestKPI = systemStatus?.kpis?.[systemStatus.kpis.length - 1]
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            System Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Real-time monitoring of ESA Vendor Dashboard agents and data quality
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {latestKPI && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <KPICard
            title="Data Completeness"
            value={latestKPI.completeness_pct}
            unit="%"
            status={latestKPI.completeness_pct >= 85 ? 'good' : latestKPI.completeness_pct >= 70 ? 'warning' : 'danger'}
            icon={ChartBarIcon}
          />
          <KPICard
            title="Conflict Rate"
            value={latestKPI.conflict_pct}
            unit="%"
            status={latestKPI.conflict_pct <= 5 ? 'good' : latestKPI.conflict_pct <= 10 ? 'warning' : 'danger'}
            icon={ExclamationTriangleIcon}
          />
          <KPICard
            title="Mean Latency"
            value={latestKPI.mean_latency_min}
            unit="min"
            status={latestKPI.mean_latency_min <= 5 ? 'good' : latestKPI.mean_latency_min <= 10 ? 'warning' : 'danger'}
            icon={ClockIcon}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Workflow Status */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Workflows</h3>
          <div className="space-y-3">
            {systemStatus?.workflows?.map((workflow) => (
              <div key={workflow.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
                  <p className="text-xs text-gray-500">Last run: {workflow.lastRun}</p>
                </div>
                <StatusBadge status={workflow.status} />
              </div>
            )) || (
              <p className="text-sm text-gray-500">No workflow data available</p>
            )}
          </div>
        </div>

        {/* System Info */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CircleStackIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">Production Base</span>
              </div>
              <span className="text-sm font-mono text-gray-600">
                {systemStatus?.prodBaseId || 'Unknown'}
              </span>
            </div>
            
            {/* Architecture & Monitoring Links */}
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-medium text-gray-900 mb-2">🏗️ Architecture & Monitoring</h4>
              <div className="space-y-2">
                <a 
                  href="/control-tower/architecture" 
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ServerIcon className="h-4 w-4 mr-2" />
                  System Architecture Map
                </a>
                <a 
                  href="/system_status.json" 
                  target="_blank"
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                  System Status JSON
                </a>
                <div className="text-xs text-gray-500 mt-1">
                  📊 Real-time system monitoring and architecture visualization
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ServerIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">Staging Base</span>
              </div>
              <span className="text-sm font-mono text-gray-600">
                {systemStatus?.stagingBaseId || 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">Pending Changes</span>
              </div>
              <span className={`text-sm font-medium ${
                (systemStatus?.changeReviewCount || 0) > 0 ? 'text-warning-600' : 'text-success-600'
              }`}>
                {systemStatus?.changeReviewCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <a href="/dashboard/change-review" className="btn-primary">
            Review Changes ({systemStatus?.changeReviewCount || 0})
          </a>
          <a href="/dashboard/logs" className="btn-secondary">
            View Logs
          </a>
          <a href="/dashboard/costs" className="btn-secondary">
            Check Costs
          </a>
          <button 
            onClick={() => window.open('https://github.com/your-org/esa-vendor-dashboard/actions', '_blank')}
            className="btn-secondary"
          >
            GitHub Actions
          </button>
        </div>
      </div>
    </div>
  )
}