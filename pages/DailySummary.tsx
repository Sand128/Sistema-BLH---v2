
import React, { useEffect, useState } from 'react';
import { 
  Calendar, Building2, User, FlaskConical, Info, 
  ChevronRight, ClipboardList, CheckCircle2, History,
  ThermometerSnowflake, FileText, Download, List, Clock
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { Bottle } from '../types';
import { Button } from '../components/ui/Button';

interface HospitalGroup {
  initials: string;
  totalVolume: number;
  bottleCount: number;
  bottles: Bottle[];
}

export const DailySummary: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hospitalGroups, setHospitalGroups] = useState<HospitalGroup[]>([]);

  useEffect(() => {
    loadDailyData();
  }, [selectedDate]);

  const loadDailyData = async () => {
    setLoading(true);
    try {
      const allBottles = await batchService.getAllBottles();
      const dailyBottles = allBottles.filter(b => b.collectionDate === selectedDate);
      setBottles(dailyBottles);

      // Group by hospital
      const groups: Record<string, HospitalGroup> = {};
      dailyBottles.forEach(b => {
        if (!groups[b.hospitalInitials]) {
          groups[b.hospitalInitials] = {
            initials: b.hospitalInitials,
            totalVolume: 0,
            bottleCount: 0,
            bottles: []
          };
        }
        groups[b.hospitalInitials].totalVolume += b.volume;
        groups[b.hospitalInitials].bottleCount += 1;
        groups[b.hospitalInitials].bottles.push(b);
      });

      setHospitalGroups(Object.values(groups).sort((a, b) => b.totalVolume - a.totalVolume));
    } catch (error) {
      console.error("Error loading daily summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = bottles.reduce((acc, b) => acc + b.volume, 0);
  const totalBottles = bottles.length;
  const uniqueDonors = new Set(bottles.map(b => b.donorId)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-primary-600" />
            Resumen Diario de Operaciones
          </h1>
          <p className="text-slate-500 mt-1">Consolidado de recolecciones por centro y donadora.</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar className="h-5 w-5 text-slate-400 ml-2" />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 focus:ring-0 text-sm font-bold text-slate-700 p-1"
          />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-50 rounded-xl text-pink-600"><FlaskConical className="h-8 w-8" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Volumen Total Recibido</p>
            <p className="text-3xl font-black text-slate-900">{(totalVolume / 1000).toFixed(2)} L</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><ThermometerSnowflake className="h-8 w-8" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Frascos Registrados</p>
            <p className="text-3xl font-black text-slate-900">{totalBottles}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><User className="h-8 w-8" /></div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Donadoras Contribuyentes</p>
            <p className="text-3xl font-black text-slate-900">{uniqueDonors}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium italic">Sincronizando registros de red...</p>
        </div>
      ) : bottles.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 py-24 text-center">
          <History className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800">No hay recolecciones registradas</h3>
          <p className="text-slate-500 mt-2">Para la fecha seleccionada ({new Date(selectedDate).toLocaleDateString()}) aún no existen ingresos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Summary by Hospital (Left) */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Aporte por Hospital
            </h3>
            <div className="space-y-4">
              {hospitalGroups.map(group => (
                <div key={group.initials} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-primary-200 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-600 border border-white shadow-sm">
                        {group.initials.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900">{group.initials}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{group.bottleCount} frascos</p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-primary-600">{group.totalVolume} ml</span>
                  </div>
                  
                  {/* Small progress bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary-500 h-full group-hover:bg-primary-600 transition-all duration-500" 
                      style={{ width: `${(group.totalVolume / totalVolume) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details by Donor (Right) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <List className="h-4 w-4" /> Detalle de Recolección Individual
            </h3>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-4">Donadora / Hora</th>
                    <th className="px-6 py-4">Hospital</th>
                    <th className="px-6 py-4">Volumen</th>
                    <th className="px-6 py-4">Código Trazabilidad</th>
                    <th className="px-6 py-4">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bottles.map(bottle => (
                    <tr key={bottle.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600 font-black text-xs">
                            {bottle.donorName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{bottle.donorName}</p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {bottle.collectionDateTime ? new Date(bottle.collectionDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                          {bottle.hospitalInitials}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-slate-900">{bottle.volume} ml</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] text-slate-500 font-bold">{bottle.traceabilityCode}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500 italic truncate max-w-[150px]" title={bottle.observations}>
                          {bottle.observations || 'Sin observaciones'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin del reporte diario</p>
                <Button variant="outline" className="h-8 text-[10px] uppercase font-black tracking-widest">
                  <Download className="h-3 w-3 mr-2" /> Exportar CSV
                </Button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Action Footer */}
      <div className="bg-primary-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group mt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
              <CheckCircle2 className="h-8 w-8 text-primary-400" />
            </div>
            <div>
              <h4 className="text-xl font-black">Cierre de Jornada</h4>
              <p className="text-primary-200 text-sm">Asegúrese de que todos los frascos físicos coincidan con el sistema antes de conformar los lotes.</p>
            </div>
          </div>
          <Button className="bg-white text-primary-900 hover:bg-primary-50 px-8 py-4 text-lg font-black h-auto">
            <FlaskConical className="h-5 w-5 mr-2" />
            Ir a Conformación de Lotes
          </Button>
        </div>
      </div>
    </div>
  );
};
