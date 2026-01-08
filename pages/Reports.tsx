
import React, { useState, useEffect } from 'react';
import { 
    Download, Calendar, FileWarning, Loader2, AlertCircle, 
    ChevronUp, ChevronDown, Hospital, UserCheck, Percent 
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { reportService, MonthlyFrequencyRow } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import { authService } from '../services/authService';

export const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const currentUser = authService.getCurrentUser();
  
  // Data States
  const [frequencyData, setFrequencyData] = useState<MonthlyFrequencyRow[]>([]);
  const [filteredFreq, setFilteredFreq] = useState<MonthlyFrequencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Sorting
  const [sortKey, setSortKey] = useState<keyof MonthlyFrequencyRow>('mes_anio');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Specific Filters
  const [unitFilter, setUnitFilter] = useState('');
  const [responsibleFilter, setResponsibleFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fData = await reportService.getMonthlyFrequencyTable(startDate, endDate);
      setFrequencyData(fData);
      setFilteredFreq(fData);
    } catch (error) {
      console.error("Error al consolidar datos de análisis:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      let filtered = [...frequencyData];
      if (unitFilter) {
          filtered = filtered.filter(f => f.unidad_medica.toLowerCase().includes(unitFilter.toLowerCase()));
      }
      if (responsibleFilter) {
          filtered = filtered.filter(f => f.responsable.toLowerCase().includes(responsibleFilter.toLowerCase()));
      }
      
      // Apply Sort
      filtered.sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });

      setFilteredFreq(filtered);
  }, [unitFilter, responsibleFilter, sortKey, sortOrder, frequencyData]);

  const handleSort = (key: keyof MonthlyFrequencyRow) => {
      if (sortKey === key) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
          setSortKey(key);
          setSortOrder('asc');
      }
  };

  const handleInadequateReport = async () => {
    setGeneratingPdf(true);
    try {
      const data = await reportService.getInadequateSamplesData(startDate, endDate);
      const pdfBytes = await pdfService.generateInadequateSamplesReport({
        rangoFechas: `${startDate} al ${endDate}`,
        unidadMedica: 'HMPMPS - TOLUCA',
        rows: data.rows,
        stats: {
          totalAnalizadas: data.totalAnalizadas,
          totalInadecuadas: data.totalInadecuadas,
          porcentajeRechazo: data.porcentajeRechazo,
          causaPrincipal: data.causaPrincipal
        },
        responsable: currentUser?.name || 'Responsable de Verificación'
      });
      const dateObj = new Date(startDate);
      const filename = `Frecuencia_Mensual_Muestras_Inadecuadas_${dateObj.getMonth() + 1}-${dateObj.getFullYear()}.pdf`;
      pdfService.downloadPdf(pdfBytes, filename);
    } catch (error) {
      console.error(error);
      alert('Error al generar el reporte oficial.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const SortIcon = ({ col }: { col: keyof MonthlyFrequencyRow }) => {
      if (sortKey !== col) return <div className="w-4 h-4 opacity-20"><ChevronUp className="h-4 w-4" /></div>;
      return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 text-primary-500" /> : <ChevronDown className="h-4 w-4 text-primary-500" />;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Reportes</h1>
          <p className="mt-1 text-sm text-slate-500">Gestión de indicadores de calidad y consolidación mensual de muestras inadecuadas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button onClick={handleInadequateReport} isLoading={generatingPdf} className="bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-100">
             <Download className="h-4 w-4 mr-2" /> Exportar Formato Oficial (PDF)
           </Button>
        </div>
      </div>

      {/* Primary Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Periodo Desde</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border-slate-300 bg-slate-50 p-2.5 border" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hasta</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border-slate-300 bg-slate-50 p-2.5 border" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unidad Médica</label>
            <div className="relative">
                <Hospital className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Filtrar unidad..." value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="w-full pl-9 rounded-md border-slate-300 bg-white p-2.5 border text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Responsable</label>
            <div className="relative">
                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Filtrar responsable..." value={responsibleFilter} onChange={(e) => setResponsibleFilter(e.target.value)} className="w-full pl-9 rounded-md border-slate-300 bg-white p-2.5 border text-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Consolidated Table */}
      <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 min-h-[500px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 text-primary-500 animate-spin" />
                <p className="text-slate-500 font-medium">Consolidando registros de análisis...</p>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <FileWarning className="h-5 w-5 text-orange-500" />
                        Frecuencia Mensual de Muestras Inadecuadas
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        Solo lectura: Datos sincronizados con el módulo de Análisis.
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50">
                            <tr>
                                <th onClick={() => handleSort('unidad_medica')} className="px-4 py-4 text-left font-bold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-1">Unidad Médica / Responsable <SortIcon col="unidad_medica" /></div>
                                </th>
                                <th onClick={() => handleSort('mes_anio')} className="px-4 py-4 text-left font-bold text-slate-600 uppercase cursor-pointer hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-1">Periodo <SortIcon col="mes_anio" /></div>
                                </th>
                                <th className="px-2 py-4 text-center font-bold text-red-600 uppercase bg-red-50/50">Acidez</th>
                                <th className="px-2 py-4 text-center font-bold text-red-600 uppercase bg-red-50/50">Envase</th>
                                <th className="px-2 py-4 text-center font-bold text-red-600 uppercase bg-red-50/50">Suciedad</th>
                                <th className="px-2 py-4 text-center font-bold text-red-600 uppercase bg-red-50/50">Color/Flavor</th>
                                <th className="px-2 py-4 text-center font-bold text-slate-800 uppercase border-l-2 border-slate-200">Total Inadecuadas</th>
                                <th className="px-2 py-4 text-center font-bold text-slate-500 uppercase">Analizadas</th>
                                <th className="px-4 py-4 text-right font-bold text-primary-600 uppercase">Responsable Verificación</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredFreq.length === 0 ? (
                                <tr><td colSpan={9} className="p-12 text-center text-slate-400 italic">No se encontraron registros en el periodo seleccionado.</td></tr>
                            ) : filteredFreq.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-4 font-bold text-slate-900 whitespace-nowrap">
                                        {row.unidad_medica}
                                    </td>
                                    <td className="px-4 py-4 font-medium text-slate-600 whitespace-nowrap">{row.mes_anio}</td>
                                    
                                    <td className="px-2 py-4 text-center bg-red-50/10">
                                        <span className="block font-bold text-slate-900">{row.num_rechazos_acidez}</span>
                                        <span className="text-[10px] text-red-500 font-bold">{row.porcentaje_acidez.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-2 py-4 text-center bg-red-50/10">
                                        <span className="block font-bold text-slate-900">{row.num_rechazos_envase}</span>
                                        <span className="text-[10px] text-red-500 font-bold">{row.porcentaje_envase.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-2 py-4 text-center bg-red-50/10">
                                        <span className="block font-bold text-slate-900">{row.num_rechazos_suciedad}</span>
                                        <span className="text-[10px] text-red-500 font-bold">{row.porcentaje_suciedad.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-2 py-4 text-center bg-red-50/10">
                                        <span className="block font-bold text-slate-900">{row.num_rechazos_color_flavor}</span>
                                        <span className="text-[10px] text-red-500 font-bold">{row.porcentaje_color_flavor.toFixed(1)}%</span>
                                    </td>

                                    <td className="px-2 py-4 text-center border-l-2 border-slate-200 font-extrabold text-slate-900 bg-slate-50">
                                        {row.total_muestras_inadecuadas}
                                    </td>
                                    <td className="px-2 py-4 text-center font-bold text-slate-500">
                                        {row.total_muestras_analizadas}
                                    </td>
                                    <td className="px-4 py-4 text-right italic text-slate-600 whitespace-nowrap font-medium">
                                        {row.responsable}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-bold">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-right uppercase">Totales Consolidados</td>
                                <td className="px-2 py-3 text-center">{filteredFreq.reduce((s,r) => s + r.num_rechazos_acidez, 0)}</td>
                                <td className="px-2 py-3 text-center">{filteredFreq.reduce((s,r) => s + r.num_rechazos_envase, 0)}</td>
                                <td className="px-2 py-3 text-center">{filteredFreq.reduce((s,r) => s + r.num_rechazos_suciedad, 0)}</td>
                                <td className="px-2 py-3 text-center">{filteredFreq.reduce((s,r) => s + r.num_rechazos_color_flavor, 0)}</td>
                                <td className="px-2 py-3 text-center bg-primary-600">{filteredFreq.reduce((s,r) => s + r.total_muestras_inadecuadas, 0)}</td>
                                <td className="px-2 py-3 text-center">{filteredFreq.reduce((s,r) => s + r.total_muestras_analizadas, 0)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                   <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-4">
                       <div className="p-3 bg-white rounded-lg shadow-sm"><Hospital className="h-6 w-6 text-blue-500" /></div>
                       <div><p className="text-xs font-bold text-blue-400 uppercase">Muestras Analizadas</p><p className="text-2xl font-black text-blue-900">{filteredFreq.reduce((s,r) => s + r.total_muestras_analizadas, 0)}</p></div>
                   </div>
                   <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center gap-4">
                       <div className="p-3 bg-white rounded-lg shadow-sm"><FileWarning className="h-6 w-6 text-orange-500" /></div>
                       <div><p className="text-xs font-bold text-orange-400 uppercase">Total Inadecuadas</p><p className="text-2xl font-black text-orange-900">{filteredFreq.reduce((s,r) => s + r.total_muestras_inadecuadas, 0)}</p></div>
                   </div>
                   <div className="p-4 rounded-xl bg-primary-50 border border-primary-100 flex items-center gap-4">
                       <div className="p-3 bg-white rounded-lg shadow-sm"><Percent className="h-6 w-6 text-primary-500" /></div>
                       <div>
                            <p className="text-xs font-bold text-primary-400 uppercase">Tasa de Rechazo Global</p>
                            <p className="text-2xl font-black text-primary-900">
                                {(() => {
                                    const analyzed = filteredFreq.reduce((s,r) => s + r.total_muestras_analizadas, 0);
                                    const rejected = filteredFreq.reduce((s,r) => s + r.total_muestras_inadecuadas, 0);
                                    return analyzed > 0 ? ((rejected / analyzed) * 100).toFixed(2) : "0";
                                })()}%
                            </p>
                       </div>
                   </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
