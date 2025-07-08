'use client'

import { useState, useEffect } from 'react'
import { DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface LogFile {
  name: string
  size: number
  lastModified: string
}

export default function Logs() {
  const [logFiles, setLogFiles] = useState<LogFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [logContent, setLogContent] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLogFiles()
  }, [])

  const fetchLogFiles = async () => {
    try {
      const response = await fetch('/api/logs')
      if (!response.ok) throw new Error('Failed to fetch log files')
      
      const data = await response.json()
      setLogFiles(data.files || [])
    } catch (err) {
      setError('Failed to load log files')
      console.error('Error fetching log files:', err)
    }
  }

  const fetchLogContent = async (filename: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/logs/${encodeURIComponent(filename)}`)
      if (!response.ok) throw new Error('Failed to fetch log content')
      
      const content = await response.text()
      setLogContent(content)
      setSelectedFile(filename)
    } catch (err) {
      setError('Failed to load log content')
      console.error('Error fetching log content:', err)
    } finally {
      setLoading(false)
    }
  }

  const downloadLog = (filename: string) => {
    const element = document.createElement('a')
    const file = new Blob([logContent], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Agent Logs
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View and download logs from research and airtable agents
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={fetchLogFiles}
            className="btn-secondary"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log Files List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Logs</h3>
            
            {logFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No log files found</p>
            ) : (
              <div className="space-y-2">
                {logFiles.map((file) => (
                  <button
                    key={file.name}
                    onClick={() => fetchLogContent(file.name)}
                    className={`w-full text-left p-3 rounded-md border transition-colors ${
                      selectedFile === file.name
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Log Content */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedFile || 'Select a log file'}
              </h3>
              {selectedFile && (
                <button
                  onClick={() => downloadLog(selectedFile)}
                  className="btn-secondary"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-danger-50 border border-danger-200 rounded-md">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : selectedFile ? (
              <div className="relative">
                <textarea
                  readOnly
                  value={logContent}
                  className="w-full h-96 p-4 text-sm font-mono bg-gray-50 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Log content will appear here..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  {logContent.split('\n').length} lines
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">Select a log file to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}