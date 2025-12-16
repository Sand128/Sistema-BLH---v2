
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Activity, Clock, Heart, FlaskConical, ClipboardCheck, Baby, Archive, AlertTriangle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { reportService } from '../services/reportService';
import { donorService } from '../services/donorService';
import { KPIMetrics, TrendPoint, DashboardStats, QualityStats } from '../types';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kpi, setKpi] = useState<KPIMetrics | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [quality, setQuality] = useState<QualityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [statsData, kpiData, trendsData, qualityData] = await Promise.all([
          donorService.getStats(),
          reportService.getKPIMetrics(),
          reportService.getVolumeTrends(),
          reportService.getQualityStats()
        ]);
        setStats(statsData);
        setKpi(kpiData);
        setTrends(trendsData);
        setQuality(qualityData);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500">Cargando tablero de control...</p>
        </div>
      </div>
    );
  }

  // Colors for Pie Chart
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  const StatCard = ({ title, value, icon: Icon, color, subValue, trend }: any) => (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {trend && (
                  <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    {trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {subValue && (
          <div className="mt-4 border-t pt-3">
            <p className="text-xs text-gray-500">{subValue}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control BLH</h1>
          <p className="mt-1 text-sm text-gray-500">Visión general en tiempo real del Banco de Leche.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/reports" className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Ver Reportes Detallados
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Donadoras Activas" 
          value={stats?.activeDonors} 
          icon={Heart} 
          color="bg-primary-500"
          subValue="De un total de 12 registradas"
          trend="+2 este mes"
        />
        <StatCard 
          title="Leche Disponible" 
          value={`${(stats?.availableMilkVolume || 0) / 1000} L`}
          icon={Archive} 
          color="bg-teal-500"
          subValue="Aprobada para consumo inmediato"
        />
        <StatCard 
          title="Aprobación Calidad" 
          value={`${kpi?.qualityApprovalRate}%`}
          icon={ClipboardCheck} 
          color="bg-indigo-500" 
          subValue="Objetivo institucional: >95%"
        />
        <StatCard 
          title="Lotes en Proceso" 
          value={stats?.batchesInProcess} 
          icon={FlaskConical} 
          color="bg-amber-500"
          subValue={`${stats?.batchesPendingQC} pendientes de análisis`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart: Volume Trends */}
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Tendencia de Recolección vs. Consumo</h3>
            <span className="text-sm text-gray-500">Últimos 6 meses</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" />
                <YAxis unit="ml" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="collectedVolume" name="Recolectado" stroke="#ec4899" fillOpacity={1} fill="url(#colorCollected)" strokeWidth={2} />
                <Area type="monotone" dataKey="administeredVolume" name="Administrado" stroke="#0d9488" fillOpacity={1} fill="url(#colorAdmin)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Alerts & Secondary Chart */}
        <div className="space-y-8 lg:col-span-1">
          
          {/* Alerts Panel */}
          <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50 flex items-center justify-between">
              <h3 className="text-sm font-medium text-orange-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Atención Requerida
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {stats?.batchesPendingQC ? (
                <Link to="/quality-control" className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{stats.batchesPendingQC} Lotes pendientes de QC</p>
                      <p className="text-xs text-gray-500 mt-1">Requieren análisis de laboratorio inmediato.</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ) : (
                <div className="px-6 py-4 text-sm text-gray-500 text-center">Todo al día.</div>
              )}
               {/* Mock Expiring Alert */}
               <div className="block px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">2 Frascos próximos a caducar</p>
                      <p className="text-xs text-gray-500 mt-1">Vencen en menos de 7 días.</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
            </div>
          </div>

          {/* Quality Distribution Pie Chart */}
          <div className="bg-white shadow rounded-lg border border-gray-200 p-6">
             <h3 className="text-lg font-medium text-gray-900 mb-4">Resultados de Calidad</h3>
             <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Aprobados', value: quality?.approvedCount },
                        { name: 'Rechazados', value: quality?.rejectedCount }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell key="cell-approved" fill="#10b981" />
                      <Cell key="cell-rejected" fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{kpi?.qualityApprovalRate}%</p>
                      <p className="text-xs text-gray-500">Aprobación</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
