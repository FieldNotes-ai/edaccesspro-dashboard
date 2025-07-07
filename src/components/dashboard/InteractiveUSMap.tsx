import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

interface StateData {
  state: string;
  programs: any[];
  totalRevenue: number;
  studentCount: number;
  complexity: 'Low' | 'Medium' | 'High';
  activeProductVendors?: number;
  activeServiceVendors?: number;
}

interface InteractiveUSMapProps {
  stateData: StateData[];
  selectedState: string | null;
  onStateSelect: (state: string | null) => void;
}

export default function InteractiveUSMap({ stateData, selectedState, onStateSelect }: InteractiveUSMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [usTopology, setUsTopology] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State name mapping for consistency
  const stateNameMap: Record<string, string> = {
    'Alabama': 'Alabama',
    'Alaska': 'Alaska',
    'Arizona': 'Arizona',
    'Arkansas': 'Arkansas',
    'California': 'California',
    'Colorado': 'Colorado',
    'Connecticut': 'Connecticut',
    'Delaware': 'Delaware',
    'Florida': 'Florida',
    'Georgia': 'Georgia',
    'Hawaii': 'Hawaii',
    'Idaho': 'Idaho',
    'Illinois': 'Illinois',
    'Indiana': 'Indiana',
    'Iowa': 'Iowa',
    'Kansas': 'Kansas',
    'Kentucky': 'Kentucky',
    'Louisiana': 'Louisiana',
    'Maine': 'Maine',
    'Maryland': 'Maryland',
    'Massachusetts': 'Massachusetts',
    'Michigan': 'Michigan',
    'Minnesota': 'Minnesota',
    'Mississippi': 'Mississippi',
    'Missouri': 'Missouri',
    'Montana': 'Montana',
    'Nebraska': 'Nebraska',
    'Nevada': 'Nevada',
    'New Hampshire': 'New Hampshire',
    'New Jersey': 'New Jersey',
    'New Mexico': 'New Mexico',
    'New York': 'New York',
    'North Carolina': 'North Carolina',
    'North Dakota': 'North Dakota',
    'Ohio': 'Ohio',
    'Oklahoma': 'Oklahoma',
    'Oregon': 'Oregon',
    'Pennsylvania': 'Pennsylvania',
    'Rhode Island': 'Rhode Island',
    'South Carolina': 'South Carolina',
    'South Dakota': 'South Dakota',
    'Tennessee': 'Tennessee',
    'Texas': 'Texas',
    'Utah': 'Utah',
    'Vermont': 'Vermont',
    'Virginia': 'Virginia',
    'Washington': 'Washington',
    'West Virginia': 'West Virginia',
    'Wisconsin': 'Wisconsin',
    'Wyoming': 'Wyoming'
  };

  useEffect(() => {
    // Load US topology data from a CDN
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(response => response.json())
      .then(data => {
        setUsTopology(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading US topology:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!usTopology || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 960;
    const height = 500;

    // Set up projection
    const projection = d3.geoAlbersUsa()
      .scale(1000)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Convert topology to features
    const states = feature(usTopology, usTopology.objects.states);

    // Create state data map for quick lookup
    const stateDataMap = new Map<string, StateData>();
    stateData.forEach(state => {
      stateDataMap.set(state.state, state);
    });

    // Color scale based on market size
    const maxRevenue = Math.max(...stateData.map(s => s.totalRevenue));
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([0, maxRevenue]);

    // Draw states
    svg.selectAll('path')
      .data(states.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', (d: any) => {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        if (stateInfo) {
          // Use complexity for color coding
          if (stateInfo.complexity === 'Low') return '#10b981';
          if (stateInfo.complexity === 'Medium') return '#f59e0b';
          if (stateInfo.complexity === 'High') return '#ef4444';
        }
        return '#f3f4f6'; // Default gray for states without ESA programs
      })
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('opacity', (d: any) => {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        return stateInfo ? 0.8 : 0.3;
      })
      .style('cursor', (d: any) => {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        return stateInfo ? 'pointer' : 'default';
      })
      .on('click', (event: any, d: any) => {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        if (stateInfo) {
          onStateSelect(selectedState === stateName ? null : stateName);
        }
      })
      .on('mouseover', function(event: any, d: any) {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        
        if (stateInfo) {
          d3.select(this).attr('opacity', 1);
          
          // Create tooltip
          const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'map-tooltip')
            .style('position', 'absolute')
            .style('background', 'rgba(0, 0, 0, 0.8)')
            .style('color', 'white')
            .style('padding', '8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .html(`
              <strong>${stateName}</strong><br/>
              ${stateInfo.programs.length} ESA Program(s)<br/>
              ${stateInfo.studentCount.toLocaleString()} Students<br/>
              $${(stateInfo.totalRevenue / 1000000).toFixed(0)}M Market<br/>
              ${stateInfo.complexity} Complexity
            `);

          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      })
      .on('mouseout', function(event: any, d: any) {
        const stateName = d.properties.name;
        const stateInfo = stateDataMap.get(stateName);
        
        if (stateInfo) {
          d3.select(this).attr('opacity', 0.8);
        }
        
        // Remove tooltip
        d3.selectAll('.map-tooltip').remove();
      });

    // Highlight selected state
    if (selectedState) {
      svg.selectAll('path')
        .filter((d: any) => d.properties.name === selectedState)
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 3);
    }

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        svg.selectAll('path')
          .attr('transform', event.transform);
      });

    svg.call(zoom);

  }, [usTopology, stateData, selectedState, onStateSelect]);

  if (loading) {
    return (
      <div className="relative w-full h-96 mb-6 bg-blue-50 rounded-lg border flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading interactive map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 mb-6 bg-blue-50 rounded-lg border overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 960 500"
        className="w-full h-full"
        style={{ background: '#f8fafc' }}
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-sm border p-2">
        <div className="text-xs text-gray-600 mb-2">Click states to filter</div>
        <div className="flex flex-col space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Complexity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Medium Complexity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Complexity</span>
          </div>
        </div>
      </div>
    </div>
  );
}