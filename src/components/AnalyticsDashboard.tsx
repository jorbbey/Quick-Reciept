import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchEvents } from '../lib/analytics';
import { ArrowLeft, RefreshCw, Users, Receipt, Share2, Download, MousePointer2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export default function AnalyticsDashboard({ onBack }: AnalyticsDashboardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto refresh every 30 seconds
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  // Process data for charts
  const userMap = events.reduce((acc: any, event: any) => {
    if (!acc[event.device_id]) {
      acc[event.device_id] = {
        id: event.device_id,
        events: [],
        types: new Set()
      };
    }
    acc[event.device_id].events.push(event);
    acc[event.device_id].types.add(event.event_name);
    return acc;
  }, {});

  const userList = Object.values(userMap);
  const powerUsers = userList.filter((u: any) => {
    const hasMultipleReceipts = u.events.filter((e: any) => e.event_name === 'receipt_created').length > 1;
    const hasDiverseActions = u.types.size >= 3; // e.g. opened, created, shared
    return hasMultipleReceipts || hasDiverseActions;
  });

  const stats = {
    totalUsers: userList.length,
    powerUsers: powerUsers.length,
    totalReceipts: events.filter(e => e.event_name === 'receipt_created').length,
    totalShares: events.filter(e => e.event_name === 'receipt_shared').length,
    totalDownloads: events.filter(e => e.event_name === 'receipt_downloaded').length,
    engagementRate: userList.length > 0 ? (powerUsers.length / userList.length * 100).toFixed(1) : 0,
  };

  // Group events by day
  const dailyData = events.reduce((acc: any, event: any) => {
    // Use YYYY-MM-DD for stable keys and sorting
    const dateObj = new Date(event.created_at);
    const dateKey = dateObj.toISOString().split('T')[0];
    const displayDate = dateObj.toLocaleDateString([], { month: 'short', day: '2-digit' });
    
    if (!acc[dateKey]) {
      acc[dateKey] = { 
        date: dateKey, 
        label: displayDate,
        value: 0 
      };
    }
    acc[dateKey].value += 1;
    return acc;
  }, {});

  // Sort chronologically (oldest to newest) for chart
  const chartData = Object.values(dailyData).sort((a: any, b: any) => 
    a.date.localeCompare(b.date)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium italic">Syncing with Supabase...</p>
      </div>
    );
  }

  const lastUpdated = events.length > 0 ? new Date(events[0].created_at).toLocaleTimeString() : 'Never';

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-all font-bold text-sm uppercase tracking-wider"
        >
          <ArrowLeft size={18} />
          Back to App
        </button>
        <button 
          onClick={loadData}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          title="Refresh Data"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Insights Dashboard</h1>
        <p className="text-slate-500 text-sm">Real-time usage and growth metrics via Supabase.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" size={24} />}
          label="Total Users"
          value={stats.totalUsers}
          subLabel="Unique Device IDs"
        />
        <StatCard 
          icon={<div className="relative"><Users className="text-emerald-600" size={24} /><div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /></div>}
          label="Active Users"
          value={stats.powerUsers}
          subLabel={`${stats.engagementRate}% Conversion`}
        />
        <StatCard 
          icon={<Receipt className="text-purple-600" size={24} />}
          label="Created"
          value={stats.totalReceipts}
          subLabel="Receipts Generated"
        />
        <StatCard 
          icon={<Share2 className="text-orange-600" size={24} />}
          label="Shared"
          value={stats.totalShares}
          subLabel="WhatsApp/System"
        />
        <StatCard 
          icon={<Download className="text-pink-600" size={24} />}
          label="Downloaded"
          value={stats.totalDownloads}
          subLabel="PNG & PDF Total"
        />
      </div>

      {/* Main Grid for Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-1">Growth & Stability</h3>
              <p className="text-[10px] text-slate-400 font-bold">Daily transaction volume since launch</p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black">HEALTHY</span>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    padding: '16px'
                  }}
                  labelStyle={{ fontWeight: '800', marginBottom: '6px', fontSize: '11px', color: '#64748b' }}
                  itemStyle={{ fontSize: '14px', fontWeight: 'black', color: '#2563eb' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#2563eb" 
                  radius={[8, 8, 0, 0]} 
                  barSize={40}
                  animationBegin={200}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Ranking Sidebar-like Table */}
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest mb-1">Top Performers</h3>
              <p className="text-[9px] text-slate-400 font-bold">Most active business devices</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter sticky top-0">
                <tr>
                  <th className="px-4 py-3">Device</th>
                  <th className="px-4 py-3 text-center">Work</th>
                  <th className="px-4 py-3 text-right">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {userList
                  .sort((a: any, b: any) => b.events.length - a.events.length)
                  .slice(0, 20)
                  .map((user: any, i) => {
                    const isPower = powerUsers.find((p: any) => p.id === user.id);
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 font-mono text-[10px] text-slate-500">{user.id.slice(0, 12)}</td>
                        <td className="px-4 py-4 text-center font-black text-slate-700">{user.events.length}</td>
                        <td className="px-4 py-4 text-right">
                          {isPower ? (
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full text-[8px] font-black italic">ACTIVE</span>
                          ) : (
                            <span className="text-slate-300 font-black">#{(i + 1)}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed User Breakdown Section */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest mb-1">User Engagement Detail</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comprehensive activity per unique device</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter">
              <tr>
                <th className="px-6 py-4">Device ID (Hardware)</th>
                <th className="px-6 py-4">Total Actions</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4">Shared</th>
                <th className="px-6 py-4">Exported</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {userList
                .sort((a: any, b: any) => b.events.length - a.events.length)
                .slice(0, 30)
                .map((user: any, i) => {
                  const receiptCount = user.events.filter((e: any) => e.event_name === 'receipt_created').length;
                  const shareCount = user.events.filter((e: any) => e.event_name.includes('shared')).length;
                  const downloadCount = user.events.filter((e: any) => e.event_name.includes('downloaded')).length;
                  const isPower = powerUsers.find((p: any) => p.id === user.id);
                  
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{user.id}</td>
                      <td className="px-6 py-4 font-black text-slate-700 text-sm">{user.events.length}</td>
                      <td className="px-6 py-4 font-bold text-blue-600">{receiptCount}</td>
                      <td className="px-6 py-4 font-bold text-purple-600">{shareCount}</td>
                      <td className="px-6 py-4 font-bold text-orange-600">{downloadCount}</td>
                      <td className="px-6 py-4">
                        {isPower ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-[10px] font-black tracking-tighter">POWER USER</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-bold tracking-tighter">EXPLORER</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Table (Recent Stream) */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-800 uppercase text-[10px] tracking-widest">Real-time Event Stream</h3>
          <div className="flex items-center gap-4">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest border border-slate-200 px-2 py-1 rounded-md">Last Sync: {lastUpdated}</span>
            <span className="text-[10px] text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-black uppercase">{events.length} LOGS RECORDED</span>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-tighter sticky top-0">
              <tr>
                <th className="px-8 py-4">Event Type</th>
                <th className="px-8 py-4">Device Reference</th>
                <th className="px-8 py-4">Timestamp (Server)</th>
                <th className="px-8 py-4">Payload Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {events.slice(0, 100).map((event, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                       <EventIcon name={event.event_name} />
                       <span className="font-black uppercase tracking-tight text-slate-700">{event.event_name.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4 font-mono text-[10px] text-slate-400">{event.device_id.slice(0, 16)}...</td>
                  <td className="px-8 py-4 text-slate-500 font-bold uppercase">
                    {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-8 py-4 text-slate-400 font-mono text-[9px]">
                    <div className="max-w-[300px] truncate" title={JSON.stringify(event.metadata)}>
                      {JSON.stringify(event.metadata)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subLabel }: any) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-200 space-y-6 transition-all hover:border-slate-300 group">
      <div className="p-4 w-fit bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <div className="space-y-2">
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-5xl font-black text-slate-900 tracking-tighter">{value}</p>
        <p className="text-[11px] text-slate-500 font-bold mt-3 uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          {subLabel}
        </p>
      </div>
    </div>
  );
}

function EventIcon({ name }: { name: string }) {
  if (name.includes('receipt_created')) return <Receipt size={14} className="text-emerald-500" />;
  if (name.includes('shared')) return <Share2 size={14} className="text-purple-500" />;
  if (name.includes('downloaded')) return <Download size={14} className="text-orange-500" />;
  if (name.includes('business')) return <MousePointer2 size={14} className="text-blue-500" />;
  return <div className="w-2 h-2 rounded-full bg-slate-300" />;
}
