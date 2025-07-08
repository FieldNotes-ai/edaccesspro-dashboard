#!/usr/bin/env python3
"""
ESA Vendor Dashboard - KPI Dashboard
CLI-only script for monthly KPI analysis from agent logs
No paid dependencies - standard library + free packages only
"""

import json
import csv
import argparse
import sys
from pathlib import Path
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Tuple, Optional
import statistics
import re

class KPIDashboard:
    """KPI Dashboard for ESA Vendor Dashboard analytics"""
    
    def __init__(self, logs_dir: str = "data/logs"):
        self.logs_dir = Path(logs_dir)
        self.research_log = self.logs_dir / "research_agent.log"
        self.airtable_log = self.logs_dir / "airtable_agent.log"
        
        # KPI data storage
        self.field_data = defaultdict(list)  # field_name -> [completeness_values]
        self.conflicts = []  # List of conflict events
        self.ingest_times = []  # List of ingest latency values
        self.monthly_stats = defaultdict(dict)  # month -> {kpi: value}
        
    def load_logs(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> None:
        """Load and parse log files within date range"""
        print(f"📊 Loading logs from {self.logs_dir}")
        
        # Default to last 30 days if no dates provided
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        print(f"📅 Date range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
        
        # Load research agent logs
        if self.research_log.exists():
            self._parse_research_logs(start_date, end_date)
        else:
            print(f"⚠️  Research log not found: {self.research_log}")
        
        # Load airtable agent logs
        if self.airtable_log.exists():
            self._parse_airtable_logs(start_date, end_date)
        else:
            print(f"⚠️  Airtable log not found: {self.airtable_log}")
        
        print(f"✅ Loaded {len(self.field_data)} fields, {len(self.conflicts)} conflicts, {len(self.ingest_times)} ingest events")
    
    def _parse_research_logs(self, start_date: datetime, end_date: datetime) -> None:
        """Parse research agent logs for KPI data"""
        try:
            with open(self.research_log, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        log_entry = json.loads(line.strip())
                        timestamp = datetime.fromisoformat(log_entry.get('timestamp', '').replace('Z', '+00:00'))
                        
                        # Skip entries outside date range
                        if not (start_date <= timestamp <= end_date):
                            continue
                        
                        event_type = log_entry.get('event_type', '')
                        data = log_entry.get('data', {})
                        
                        # Track webhook sends (for ingest latency)
                        if event_type == 'webhook_sent':
                            self._track_webhook_timing(timestamp, data)
                        
                        # Track dual-source validation (for conflict detection)
                        elif event_type == 'dual_source_validation':
                            self._track_validation_conflicts(timestamp, data)
                        
                        # Track field discoveries
                        elif event_type == 'field_extracted':
                            self._track_field_completeness(timestamp, data)
                            
                    except (json.JSONDecodeError, ValueError) as e:
                        print(f"⚠️  Skipping malformed log entry at line {line_num}: {e}")
                        continue
                        
        except Exception as e:
            print(f"❌ Error reading research log: {e}")
    
    def _parse_airtable_logs(self, start_date: datetime, end_date: datetime) -> None:
        """Parse airtable agent logs for KPI data"""
        try:
            with open(self.airtable_log, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        log_entry = json.loads(line.strip())
                        timestamp = datetime.fromisoformat(log_entry.get('timestamp', '').replace('Z', '+00:00'))
                        
                        # Skip entries outside date range
                        if not (start_date <= timestamp <= end_date):
                            continue
                        
                        event_type = log_entry.get('event_type', '')
                        data = log_entry.get('data', {})
                        
                        # Track webhook received (for ingest latency calculation)
                        if event_type == 'webhook_received':
                            self._track_ingest_completion(timestamp, data)
                        
                        # Track field conflicts during schema evolution
                        elif event_type == 'semantic_twin_found':
                            self._track_schema_conflicts(timestamp, data)
                        
                        # Track data quality metrics
                        elif event_type == 'nightly_metrics':
                            self._track_completeness_metrics(timestamp, data)
                        
                        # Track bulk import results
                        elif event_type == 'chunk_imported':
                            self._track_import_success(timestamp, data)
                            
                    except (json.JSONDecodeError, ValueError) as e:
                        print(f"⚠️  Skipping malformed log entry at line {line_num}: {e}")
                        continue
                        
        except Exception as e:
            print(f"❌ Error reading airtable log: {e}")
    
    def _track_webhook_timing(self, timestamp: datetime, data: Dict) -> None:
        """Track webhook send timing for latency calculation"""
        field = data.get('field', 'unknown')
        # Store timestamp for later latency calculation
        self.field_data[field].append({
            'timestamp': timestamp,
            'event': 'webhook_sent',
            'data': data
        })
    
    def _track_ingest_completion(self, timestamp: datetime, data: Dict) -> None:
        """Track ingest completion for latency calculation"""
        event_type = data.get('event_type', '')
        if event_type == 'research_update':
            # Calculate latency from webhook send to ingest
            # This is simplified - in practice you'd match by correlation ID
            self.ingest_times.append({
                'timestamp': timestamp,
                'latency_minutes': 2.5  # Mock latency - would calculate from actual timing
            })
    
    def _track_validation_conflicts(self, timestamp: datetime, data: Dict) -> None:
        """Track dual-source validation conflicts"""
        field = data.get('field', 'unknown')
        sources_count = len(data.get('sources', []))
        confidence = data.get('confidence', 0.0)
        
        # Consider it a conflict if confidence is low despite multiple sources
        if sources_count >= 2 and confidence < 0.7:
            self.conflicts.append({
                'timestamp': timestamp,
                'field': field,
                'type': 'validation_conflict',
                'confidence': confidence,
                'sources_count': sources_count
            })
    
    def _track_schema_conflicts(self, timestamp: datetime, data: Dict) -> None:
        """Track schema evolution conflicts"""
        new_field = data.get('new_field', 'unknown')
        existing_field = data.get('existing_field', 'unknown')
        
        self.conflicts.append({
            'timestamp': timestamp,
            'field': new_field,
            'type': 'schema_conflict',
            'existing_field': existing_field
        })
    
    def _track_field_completeness(self, timestamp: datetime, data: Dict) -> None:
        """Track field completeness data"""
        field = data.get('field', 'unknown')
        confidence = data.get('confidence', 0.0)
        
        self.field_data[field].append({
            'timestamp': timestamp,
            'confidence': confidence,
            'event': 'field_extracted'
        })
    
    def _track_completeness_metrics(self, timestamp: datetime, data: Dict) -> None:
        """Track completeness metrics from nightly reports"""
        completeness = data.get('completeness_percent', 0.0)
        tables = data.get('tables', {})
        
        month_key = timestamp.strftime('%Y-%m')
        if month_key not in self.monthly_stats:
            self.monthly_stats[month_key] = {}
        
        self.monthly_stats[month_key]['overall_completeness'] = completeness
        self.monthly_stats[month_key]['table_completeness'] = tables
    
    def _track_import_success(self, timestamp: datetime, data: Dict) -> None:
        """Track successful imports for latency calculation"""
        chunk_size = data.get('chunk_size', 0)
        imported = data.get('imported', 0)
        
        # Calculate processing time (mock - would use actual timing)
        processing_time = chunk_size * 0.01  # 0.01 minutes per record
        
        self.ingest_times.append({
            'timestamp': timestamp,
            'latency_minutes': processing_time,
            'records_processed': imported
        })
    
    def calculate_field_completeness(self) -> float:
        """Calculate overall field completeness percentage"""
        if not self.field_data:
            return 0.0
        
        total_confidence = 0.0
        total_fields = 0
        
        for field, events in self.field_data.items():
            field_confidences = [
                event.get('confidence', 0.0) 
                for event in events 
                if event.get('event') == 'field_extracted'
            ]
            
            if field_confidences:
                avg_confidence = statistics.mean(field_confidences)
                total_confidence += avg_confidence
                total_fields += 1
        
        return (total_confidence / total_fields * 100) if total_fields > 0 else 0.0
    
    def calculate_conflict_percentage(self) -> float:
        """Calculate conflict percentage"""
        total_events = len(self.field_data) + len(self.conflicts)
        if total_events == 0:
            return 0.0
        
        return (len(self.conflicts) / total_events * 100)
    
    def calculate_mean_ingest_latency(self) -> float:
        """Calculate mean ingest latency in minutes"""
        if not self.ingest_times:
            return 0.0
        
        latencies = [event['latency_minutes'] for event in self.ingest_times]
        return statistics.mean(latencies)
    
    def generate_monthly_kpis(self, month: Optional[str] = None) -> Dict[str, float]:
        """Generate KPIs for a specific month or current month"""
        if not month:
            month = datetime.now().strftime('%Y-%m')
        
        # Filter data for the specified month
        month_start = datetime.strptime(f"{month}-01", '%Y-%m-%d')
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        # Filter conflicts for the month
        month_conflicts = [
            c for c in self.conflicts 
            if month_start <= c['timestamp'] <= month_end
        ]
        
        # Filter ingest times for the month
        month_ingests = [
            i for i in self.ingest_times 
            if month_start <= i['timestamp'] <= month_end
        ]
        
        # Filter field data for the month
        month_field_events = []
        for field, events in self.field_data.items():
            month_events = [
                e for e in events 
                if month_start <= e['timestamp'] <= month_end
            ]
            if month_events:
                month_field_events.extend(month_events)
        
        # Calculate KPIs
        kpis = {
            'month': month,
            'field_completeness_percent': self._calculate_month_completeness(month_field_events),
            'conflict_percent': self._calculate_month_conflicts(month_conflicts, month_field_events),
            'mean_ingest_latency_minutes': self._calculate_month_latency(month_ingests),
            'total_fields_processed': len(set(
                event.get('field', event.get('data', {}).get('field', 'unknown'))
                for event in month_field_events
            )),
            'total_conflicts': len(month_conflicts),
            'total_ingests': len(month_ingests)
        }
        
        return kpis
    
    def _calculate_month_completeness(self, events: List[Dict]) -> float:
        """Calculate completeness for a specific month"""
        if not events:
            return 0.0
        
        confidences = [
            event.get('confidence', 0.0) 
            for event in events 
            if event.get('confidence') is not None
        ]
        
        return statistics.mean(confidences) * 100 if confidences else 0.0
    
    def _calculate_month_conflicts(self, conflicts: List[Dict], total_events: List[Dict]) -> float:
        """Calculate conflict percentage for a specific month"""
        total = len(conflicts) + len(total_events)
        return (len(conflicts) / total * 100) if total > 0 else 0.0
    
    def _calculate_month_latency(self, ingests: List[Dict]) -> float:
        """Calculate mean latency for a specific month"""
        if not ingests:
            return 0.0
        
        latencies = [ingest['latency_minutes'] for ingest in ingests]
        return statistics.mean(latencies)
    
    def print_kpis(self, month: Optional[str] = None) -> None:
        """Print KPIs to console"""
        kpis = self.generate_monthly_kpis(month)
        
        print(f"\n📊 ESA Vendor Dashboard - KPI Report")
        print(f"{'=' * 50}")
        print(f"📅 Month: {kpis['month']}")
        print(f"{'=' * 50}")
        print(f"🎯 Field Completeness: {kpis['field_completeness_percent']:.1f}%")
        print(f"⚠️  Conflict Rate: {kpis['conflict_percent']:.1f}%")
        print(f"⏱️  Mean Ingest Latency: {kpis['mean_ingest_latency_minutes']:.2f} minutes")
        print(f"{'=' * 50}")
        print(f"📈 Volume Metrics:")
        print(f"   • Fields Processed: {kpis['total_fields_processed']}")
        print(f"   • Total Conflicts: {kpis['total_conflicts']}")
        print(f"   • Total Ingests: {kpis['total_ingests']}")
        print(f"{'=' * 50}")
        
        # Add status indicators
        self._print_status_indicators(kpis)
    
    def _print_status_indicators(self, kpis: Dict[str, float]) -> None:
        """Print status indicators based on KPI thresholds"""
        print(f"🚦 Status Indicators:")
        
        # Field Completeness (target: >85%)
        completeness = kpis['field_completeness_percent']
        if completeness >= 85:
            print(f"   ✅ Field Completeness: EXCELLENT ({completeness:.1f}%)")
        elif completeness >= 70:
            print(f"   🟡 Field Completeness: GOOD ({completeness:.1f}%)")
        else:
            print(f"   🔴 Field Completeness: NEEDS IMPROVEMENT ({completeness:.1f}%)")
        
        # Conflict Rate (target: <5%)
        conflicts = kpis['conflict_percent']
        if conflicts <= 5:
            print(f"   ✅ Conflict Rate: EXCELLENT ({conflicts:.1f}%)")
        elif conflicts <= 10:
            print(f"   🟡 Conflict Rate: ACCEPTABLE ({conflicts:.1f}%)")
        else:
            print(f"   🔴 Conflict Rate: HIGH ({conflicts:.1f}%)")
        
        # Ingest Latency (target: <5 minutes)
        latency = kpis['mean_ingest_latency_minutes']
        if latency <= 5:
            print(f"   ✅ Ingest Latency: EXCELLENT ({latency:.2f}m)")
        elif latency <= 10:
            print(f"   🟡 Ingest Latency: ACCEPTABLE ({latency:.2f}m)")
        else:
            print(f"   🔴 Ingest Latency: SLOW ({latency:.2f}m)")
    
    def export_csv(self, filename: str, months: Optional[List[str]] = None) -> None:
        """Export KPIs to CSV file"""
        if not months:
            # Generate last 6 months
            current_date = datetime.now()
            months = []
            for i in range(6):
                month_date = current_date - timedelta(days=30 * i)
                months.append(month_date.strftime('%Y-%m'))
            months.reverse()
        
        print(f"📄 Exporting KPIs to {filename}")
        
        with open(filename, 'w', newline='') as csvfile:
            fieldnames = [
                'month',
                'field_completeness_percent',
                'conflict_percent', 
                'mean_ingest_latency_minutes',
                'total_fields_processed',
                'total_conflicts',
                'total_ingests'
            ]
            
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for month in months:
                kpis = self.generate_monthly_kpis(month)
                writer.writerow(kpis)
        
        print(f"✅ CSV exported successfully")
    
    def generate_trend_analysis(self, months: int = 6) -> None:
        """Generate trend analysis for the last N months"""
        current_date = datetime.now()
        month_list = []
        
        for i in range(months):
            month_date = current_date - timedelta(days=30 * i)
            month_list.append(month_date.strftime('%Y-%m'))
        
        month_list.reverse()
        
        print(f"\n📈 Trend Analysis - Last {months} Months")
        print(f"{'=' * 60}")
        
        completeness_trend = []
        conflict_trend = []
        latency_trend = []
        
        for month in month_list:
            kpis = self.generate_monthly_kpis(month)
            completeness_trend.append(kpis['field_completeness_percent'])
            conflict_trend.append(kpis['conflict_percent'])
            latency_trend.append(kpis['mean_ingest_latency_minutes'])
            
            print(f"{month}: Completeness {kpis['field_completeness_percent']:.1f}% | "
                  f"Conflicts {kpis['conflict_percent']:.1f}% | "
                  f"Latency {kpis['mean_ingest_latency_minutes']:.2f}m")
        
        # Calculate trends
        print(f"\n📊 Trend Summary:")
        if len(completeness_trend) >= 2:
            comp_change = completeness_trend[-1] - completeness_trend[0]
            print(f"   • Completeness: {comp_change:+.1f}% {'📈' if comp_change > 0 else '📉' if comp_change < 0 else '➡️'}")
            
            conf_change = conflict_trend[-1] - conflict_trend[0]
            print(f"   • Conflicts: {conf_change:+.1f}% {'📉' if conf_change < 0 else '📈' if conf_change > 0 else '➡️'}")
            
            lat_change = latency_trend[-1] - latency_trend[0]
            print(f"   • Latency: {lat_change:+.2f}m {'📉' if lat_change < 0 else '📈' if lat_change > 0 else '➡️'}")

def generate_daily_kpis(self, days: int = 30) -> List[Dict]:
    """Generate daily KPIs for the last N days"""
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    daily_kpis = []
    
    for i in range(days):
        current_date = start_date + timedelta(days=i)
        date_str = current_date.strftime('%Y-%m-%d')
        
        # Filter data for this specific day
        day_start = current_date.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        # Filter conflicts for the day
        day_conflicts = [
            c for c in self.conflicts 
            if day_start <= c['timestamp'] <= day_end
        ]
        
        # Filter ingest times for the day
        day_ingests = [
            i for i in self.ingest_times 
            if day_start <= i['timestamp'] <= day_end
        ]
        
        # Filter field data for the day
        day_field_events = []
        for field, events in self.field_data.items():
            day_events = [
                e for e in events 
                if day_start <= e['timestamp'] <= day_end
            ]
            day_field_events.extend(day_events)
        
        # Calculate daily KPIs
        completeness_pct = self._calculate_day_completeness(day_field_events)
        conflict_pct = self._calculate_day_conflicts(day_conflicts, day_field_events)
        mean_latency_min = self._calculate_day_latency(day_ingests)
        
        daily_kpis.append({
            'date': date_str,
            'completeness_pct': round(completeness_pct, 2),
            'conflict_pct': round(conflict_pct, 2),
            'mean_latency_min': round(mean_latency_min, 2)
        })
    
    return daily_kpis

def _calculate_day_completeness(self, events: List[Dict]) -> float:
    """Calculate completeness for a specific day"""
    if not events:
        return 0.0
    
    confidences = [
        event.get('confidence', 0.0) 
        for event in events 
        if event.get('confidence') is not None
    ]
    
    return statistics.mean(confidences) * 100 if confidences else 0.0

def _calculate_day_conflicts(self, conflicts: List[Dict], total_events: List[Dict]) -> float:
    """Calculate conflict percentage for a specific day"""
    total = len(conflicts) + len(total_events)
    return (len(conflicts) / total * 100) if total > 0 else 0.0

def _calculate_day_latency(self, ingests: List[Dict]) -> float:
    """Calculate mean latency for a specific day"""
    if not ingests:
        return 0.0
    
    latencies = [ingest['latency_minutes'] for ingest in ingests]
    return statistics.mean(latencies)

def print_daily_table(self, days: int = 30):
    """Print daily KPIs as a formatted table"""
    daily_kpis = self.generate_daily_kpis(days)
    
    print(f"\n📊 Daily KPI Summary - Last {days} Days")
    print("=" * 60)
    print(f"{'Date':<12} {'Completeness %':<15} {'Conflict %':<12} {'Latency (min)':<15}")
    print("-" * 60)
    
    for kpi in daily_kpis:
        print(f"{kpi['date']:<12} {kpi['completeness_pct']:<15.2f} {kpi['conflict_pct']:<12.2f} {kpi['mean_latency_min']:<15.2f}")
    
    # Summary statistics
    if daily_kpis:
        avg_completeness = statistics.mean([k['completeness_pct'] for k in daily_kpis])
        avg_conflicts = statistics.mean([k['conflict_pct'] for k in daily_kpis])
        avg_latency = statistics.mean([k['mean_latency_min'] for k in daily_kpis])
        
        print("-" * 60)
        print(f"{'AVERAGE':<12} {avg_completeness:<15.2f} {avg_conflicts:<12.2f} {avg_latency:<15.2f}")

def export_daily_csv(self, filename: str = "kpi.csv", days: int = 30):
    """Export daily KPIs to CSV file"""
    daily_kpis = self.generate_daily_kpis(days)
    
    print(f"📄 Exporting daily KPIs to {filename}")
    
    with open(filename, 'w', newline='') as csvfile:
        fieldnames = ['date', 'completeness_pct', 'conflict_pct', 'mean_latency_min']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        
        writer.writeheader()
        for kpi in daily_kpis:
            writer.writerow(kpi)
    
    print(f"✅ CSV exported successfully ({len(daily_kpis)} days)")

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(
        description='ESA Vendor Dashboard KPI Analytics',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python kpi_dashboard.py                          # Daily table (30 days)
  python kpi_dashboard.py --csv                    # Export to kpi.csv
  python kpi_dashboard.py --csv --days 7          # Export last 7 days
  python kpi_dashboard.py --month 2024-01         # Specific month
  python kpi_dashboard.py --trend 12              # 12-month trend analysis
        """
    )
    
    parser.add_argument(
        '--csv',
        action='store_true',
        help='Export daily KPIs to kpi.csv'
    )
    
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='Number of days to analyze (default: 30)'
    )
    
    parser.add_argument(
        '--month', 
        help='Specific month to analyze (YYYY-MM format)',
        default=None
    )
    
    parser.add_argument(
        '--export',
        help='Export KPIs to CSV file',
        metavar='FILENAME'
    )
    
    parser.add_argument(
        '--trend',
        type=int,
        help='Generate trend analysis for N months',
        metavar='MONTHS'
    )
    
    parser.add_argument(
        '--logs-dir',
        help='Directory containing log files',
        default='data/logs'
    )
    
    parser.add_argument(
        '--start-date',
        help='Start date for analysis (YYYY-MM-DD)',
        type=lambda s: datetime.strptime(s, '%Y-%m-%d')
    )
    
    parser.add_argument(
        '--end-date',
        help='End date for analysis (YYYY-MM-DD)',
        type=lambda s: datetime.strptime(s, '%Y-%m-%d')
    )
    
    args = parser.parse_args()
    
    # Initialize dashboard
    dashboard = KPIDashboard(args.logs_dir)
    
    # Load logs
    dashboard.load_logs(args.start_date, args.end_date)
    
    # Execute requested action
    if args.csv:
        dashboard.export_daily_csv("kpi.csv", args.days)
    elif args.export:
        dashboard.export_csv(args.export)
    elif args.trend:
        dashboard.generate_trend_analysis(args.trend)
    elif args.month:
        dashboard.print_kpis(args.month)
    else:
        dashboard.print_daily_table(args.days)

if __name__ == "__main__":
    main()