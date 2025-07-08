'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface ChangeRequest {
  id: string
  action: string
  table_name: string
  field_name?: string
  details: any
  created_at: string
  status: string
  approved: boolean
}

export default function ChangeReview() {
  const [changes, setChanges] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchChanges()
  }, [])

  const fetchChanges = async () => {
    try {
      setLoading(true)
      setError(null) // Clear previous errors
      console.log('Fetching change requests...')
      
      const response = await fetch('/api/change-review')
      console.log('Change review response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Change review API error:', errorText)
        throw new Error(`Failed to fetch changes: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Change review data:', data)
      
      setChanges(data.changes || [])
      console.log(`Loaded ${data.changes?.length || 0} change requests`)
    } catch (err) {
      const errorMsg = `Failed to load change requests: ${err.message}`
      setError(errorMsg)
      console.error('Error fetching changes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (changeId: string) => {
    setProcessingId(changeId)
    setError(null) // Clear previous errors
    try {
      console.log('Approving change:', changeId)
      const response = await fetch('/api/change-review/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changeId }),
      })

      const result = await response.json()
      console.log('Approve response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve change')
      }
      
      // Show success message
      setSuccess('Change approved successfully!')
      console.log('Change approved successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
      // Refresh the list
      await fetchChanges()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to approve change'
      setError(errorMsg)
      console.error('Error approving change:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (changeId: string) => {
    setProcessingId(changeId)
    setError(null) // Clear previous errors
    try {
      console.log('Rejecting change:', changeId)
      const response = await fetch('/api/change-review/reject', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changeId }),
      })

      const result = await response.json()
      console.log('Reject response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reject change')
      }
      
      // Show success message
      setSuccess('Change rejected successfully!')
      console.log('Change rejected successfully')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
      // Refresh the list
      await fetchChanges()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to reject change'
      setError(errorMsg)
      console.error('Error rejecting change:', err)
    } finally {
      setProcessingId(null)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'delete_field':
      case 'delete_table':
        return <ExclamationTriangleIcon className="h-5 w-5 text-danger-500" />
      case 'change_type':
        return <ClockIcon className="h-5 w-5 text-warning-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'delete_field':
      case 'delete_table':
        return 'text-danger-700 bg-danger-50'
      case 'change_type':
        return 'text-warning-700 bg-warning-50'
      default:
        return 'text-gray-700 bg-gray-50'
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
            Change Review
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and approve destructive changes to Airtable schema
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchChanges}
            className="btn-secondary"
            disabled={loading}
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

      {success && (
        <div className="card">
          <div className="flex items-center text-success-600">
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Changes List */}
      {changes.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircleIcon className="mx-auto h-12 w-12 text-success-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending changes</h3>
          <p className="mt-1 text-sm text-gray-500">
            All destructive changes have been reviewed and processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => (
            <div key={change.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getActionIcon(change.action)}
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${getActionColor(change.action)}`}>
                      {change.action.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900">
                    {change.table_name}
                    {change.field_name && (
                      <span className="text-gray-500"> → {change.field_name}</span>
                    )}
                  </h3>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    Created: {new Date(change.created_at).toLocaleString()}
                  </p>
                  
                  {change.details && (
                    <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                      <pre className="whitespace-pre-wrap text-gray-700">
                        {JSON.stringify(change.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleApprove(change.id)}
                    disabled={processingId === change.id}
                    className="btn-success"
                  >
                    {processingId === change.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleReject(change.id)}
                    disabled={processingId === change.id}
                    className="btn-danger"
                  >
                    {processingId === change.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}