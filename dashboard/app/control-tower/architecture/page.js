'use client';

import { useState, useEffect } from 'react';

export default function SystemArchitecture() {
  const [systemStatus, setSystemStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [svgContent, setSvgContent] = useState('');

  // Load SVG content
  useEffect(() => {
    fetch('/architecture.svg')
      .then(response => response.text())
      .then(svg => setSvgContent(svg))
      .catch(error => console.error('Error loading SVG:', error));
  }, []);

  // Load system status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/system_status.json');
        const status = await response.json();
        setSystemStatus(status);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.error('Error fetching system status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case '✔': return 'text-green-500';
      case '◑': return 'text-amber-500';
      case '✖': return 'text-red-500';
      case '☐': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case '✔': return 'bg-green-100 border-green-300';
      case '◑': return 'bg-amber-100 border-amber-300';
      case '✖': return 'bg-red-100 border-red-300';
      case '☐': return 'bg-gray-100 border-gray-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            System Architecture Map
          </h1>
          <p className="text-gray-600">
            Real-time view of ESA Vendor Dashboard system components and their status
          </p>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* Status Legend */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status Legend</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg border ${getStatusBg('✔')}`}>
                <div className={`text-lg font-bold ${getStatusColor('✔')}`}>✔ Core</div>
                <div className="text-sm text-gray-600">Fully operational</div>
                <div className="text-lg font-bold text-gray-900">{systemStatus.summary.core}</div>
              </div>
              <div className={`p-3 rounded-lg border ${getStatusBg('◑')}`}>
                <div className={`text-lg font-bold ${getStatusColor('◑')}`}>◑ Partial</div>
                <div className="text-sm text-gray-600">Work in progress</div>
                <div className="text-lg font-bold text-gray-900">{systemStatus.summary.partial}</div>
              </div>
              <div className={`p-3 rounded-lg border ${getStatusBg('✖')}`}>
                <div className={`text-lg font-bold ${getStatusColor('✖')}`}>✖ Legacy</div>
                <div className="text-sm text-gray-600">Unused ≥ 90 days</div>
                <div className="text-lg font-bold text-gray-900">{systemStatus.summary.legacy}</div>
              </div>
              <div className={`p-3 rounded-lg border ${getStatusBg('☐')}`}>
                <div className={`text-lg font-bold ${getStatusColor('☐')}`}>☐ Missing</div>
                <div className="text-sm text-gray-600">Roadmap item absent</div>
                <div className="text-lg font-bold text-gray-900">{systemStatus.summary.missing}</div>
              </div>
            </div>
          </div>
        )}

        {/* Node Status Grid */}
        {systemStatus && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Component Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(systemStatus.nodes).map(([key, status]) => (
                <div key={key} className={`p-3 rounded-lg border text-center ${getStatusBg(status)}`}>
                  <div className={`text-2xl font-bold ${getStatusColor(status)}`}>{status}</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{key}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architecture Diagram */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Architecture Diagram</h2>
            <div className="text-sm text-gray-500">
              Auto-refreshes every 30 seconds
            </div>
          </div>
          
          {svgContent ? (
            <div 
              className="w-full overflow-auto bg-gray-900 rounded-lg p-4"
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading architecture diagram...</p>
              </div>
            </div>
          )}
        </div>

        {/* Back to Control Tower */}
        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ← Back to Control Tower
          </a>
        </div>
      </div>
    </div>
  );
}
