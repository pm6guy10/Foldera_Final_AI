'use client';

import React from 'react';
import { 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  Shield,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import FileUpload from '@/components/FileUpload';
import { AuditVisualization } from '@/components/AuditVisualization';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800/50 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
            <span className="text-lg font-light">Foldera Dashboard</span>
          </div>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-2">Welcome to Your Dashboard</h1>
            <p className="text-slate-400">Monitor your AI document analysis and insights</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-cyan-400" />
                <span className="text-2xl font-light">247</span>
              </div>
              <p className="text-sm text-slate-400">Documents Analyzed</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <span className="text-2xl font-light">12</span>
              </div>
              <p className="text-sm text-slate-400">Conflicts Detected</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-light">89%</span>
              </div>
              <p className="text-sm text-slate-400">Accuracy Rate</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-light">2.4h</span>
              </div>
              <p className="text-sm text-slate-400">Time Saved Today</p>
            </div>
          </div>

          {/* Audit Visualization */}
          <div className="mb-8">
            <AuditVisualization />
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light">Recent Activity</h2>
              <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <div>
                    <p className="text-sm">Executive briefing generated</p>
                    <p className="text-xs text-slate-500">2 minutes ago</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-400 rounded-full" />
                  <div>
                    <p className="text-sm">Conflict detected in Q4 report</p>
                    <p className="text-xs text-slate-500">15 minutes ago</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                  <div>
                    <p className="text-sm">New document uploaded</p>
                    <p className="text-xs text-slate-500">1 hour ago</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-2xl p-6 text-left hover:shadow-lg hover:shadow-cyan-500/30 transform hover:scale-105 transition-all">
              <BarChart3 className="w-8 h-8 mb-3" />
              <h3 className="font-medium mb-1">View Full Report</h3>
              <p className="text-sm opacity-90">Access your latest executive briefing</p>
            </button>

            <button className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 transition-all">
              <FileText className="w-8 h-8 mb-3 text-cyan-400" />
              <h3 className="font-medium mb-1">Upload Document</h3>
              <p className="text-sm text-slate-400">Add new files for analysis</p>
            </button>

            <button className="bg-slate-900/50 backdrop-blur border border-slate-800 rounded-2xl p-6 text-left hover:border-slate-700 transition-all">
              <Shield className="w-8 h-8 mb-3 text-purple-400" />
              <h3 className="font-medium mb-1">Compliance Check</h3>
              <p className="text-sm text-slate-400">Run compliance audit</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
