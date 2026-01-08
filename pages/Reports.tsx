
import React, { useState, useEffect } from 'react';
import { 
    Download, Calendar, FileWarning, Loader2, AlertCircle, 
    ChevronUp, ChevronDown, Hospital, UserCheck, Percent,
    Users, Filter, FileText, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { reportService, MonthlyFrequencyRow, DonorsReportParams } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import { authService } from '../services/authService';

export const Reports: React.FC = () => {
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const currentUser = authService.getCurrentUser();
  
  // Quality Report States
  const [frequencyData, setFrequencyData] = useState<MonthlyFrequencyRow[]>([]);
  const [filteredFreq, setFilteredFreq] = useState<MonthlyFrequencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Donors Report Filter State
  const [donorParams, setDonorParams] = useState<DonorsReportParams>({
    status: 'ALL',
    category: 'ALL',
    periodType: 'BIMONTHLY',
    periodValue: 1,
    year: new Date().getFullYear()
  });
  const [generatingDonorsPdf, setGeneratingDonorsPdf] = useState(false);

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
      pdfService.downloadPdf(pdfBytes, `Muestras_Inadecuadas_${startDate}_${endDate}.pdf`);
    } catch (error) {
      console.error(error);
      alert('Error al generar el reporte.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDonorsReport = async () => {
    setGeneratingDonorsPdf(true);
    try {
      const { donors, stats } = await reportService.getDonorsReportData(donorParams);
      const pdfBytes = await pdfService.generateDonorsDetailedReport({
        periodo: stats.periodLabel,
        año: stats.year,
        donadoras: donors,
        stats: {
          total: stats.total,
          aptas: stats.aptas,
          noAptas: stats.noAptas
        },
        responsable: currentUser?.name || 'Responsable de Captación'
      });
      pdfService.downloadPdf(pdfBytes, `Reporte_Donadoras_${stats.periodLabel}_${stats.year}.pdf`);
    } catch (error) {
      console.error(error);
      alert('Error al generar reporte de donadoras.');
    } finally {
      setGeneratingDonorsPdf(false);
    }
  };

  const filterBtnClass = (active: boolean) => `px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
    active ? 'bg-primary-600 text-white border-primary-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
  }`;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Módulo de Reportes e Indicadores</h1>
          <p className="mt-1 text-sm text-slate-500 italic">Generación automática de formatos institucionales para auditoría.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* NEW SECTION: DONORS AUTOMATED REPORT */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-pink-50 border-b border-pink-100 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-pink-600">
                    <Users className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Reporte de Captación de Donadoras</h3>
                    <p className="text-[10px] text-pink-700 font-bold uppercase">Consolidado por periodos oficiales</p>
                </div>
            </div>
            
            <div className="p-8 flex-1 space-y-8">
                {/* Status Filter */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Filter className="h-3 w-3" /> Estatus de Donadora
                    </label>
                    <div className="flex gap-2">
                        <button onClick={() => setDonorParams({...donorParams, status: 'ALL'})} className={filterBtnClass(donorParams.status === 'ALL')}>Todas</button>
                        <button onClick={() => setDonorParams({...donorParams, status: 'ACTIVE'})} className={filterBtnClass(donorParams.status === 'ACTIVE')}><CheckCircle2 className="h-3 w-3 mr-1 inline" /> Aptas</button>
                        <button onClick={() => setDonorParams({...donorParams, status: 'REJECTED'})} className={filterBtnClass(donorParams.status === 'REJECTED')}><XCircle className="h-3 w-3 mr-1 inline" /> No Aptas</button>
                    </div>
                </div>

                {/* Period Config */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Tipo de Periodo
                        </label>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setDonorParams({...donorParams, periodType: 'BIMONTHLY', periodValue: 1})} 
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${donorParams.periodType === 'BIMONTHLY' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'}`}
                            >BIMESTRAL</button>
                            <button 
                                onClick={() => setDonorParams({...donorParams, periodType: 'SEMESTRAL', periodValue: 1})} 
                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${donorParams.periodType === 'SEMESTRAL' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500'}`}
                            >SEMESTRAL</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Año</label>
                        <select 
                            value={donorParams.year}
                            onChange={(e) => setDonorParams({...donorParams, year: parseInt(e.target.value)})}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700"
                        >
                            <option value={2024}>2024</option>
                            <option value={2023}>2023</option>
                        </select>
                    </div>
                </div>

                {/* Period Value Selector */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar {donorParams.periodType === 'BIMONTHLY' ? 'Bimestre' : 'Semestre'}</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {donorParams.periodType === 'BIMONTHLY' ? [1,2,3,4,5,6].map(v => (
                            <button 
                                key={v} 
                                onClick={() => setDonorParams({...donorParams, periodValue: v})}
                                className={`py-2 text-xs font-black rounded-lg border ${donorParams.periodValue === v ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-100 text-slate-400'}`}
                            >{v}° Bim</button>
                        )) : [1,2].map(v => (
                            <button 
                                key={v} 
                                onClick={() => setDonorParams({...donorParams, periodValue: v})}
                                className={`col-span-3 py-2 text-xs font-black rounded-lg border ${donorParams.periodValue === v ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-slate-100 text-slate-400'}`}
                            >{v}° Semestre</button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <InfoIcon className="h-4 w-4" />
                        <span className="text-[10px] font-medium leading-tight">El reporte incluye ficha técnica, <br/> listado completo y firma calificada.</span>
                    </div>
                    <Button 
                        onClick={handleDonorsReport} 
                        isLoading={generatingDonorsPdf}
                        className="bg-primary-600 hover:bg-primary-700 h-14 px-8 rounded-2xl shadow-xl shadow-primary-100 text-base"
                    >
                        <FileText className="h-5 w-5 mr-2" />
                        Generar Reporte de Donadoras
                    </Button>
                </div>
            </div>
        </div>

        {/* QUALITY CONTROL REPORT (Existing Logic Refined) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600">
                    <FileWarning className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Muestras Inadecuadas</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Control Fisicoquímico y Microbiológico</p>
                </div>
            </div>
            
            <div className="p-8 flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desde</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hasta</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold" />
                    </div>
                </div>

                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                        Este reporte consolida automáticamente todos los lotes marcados como <strong>RECHAZADOS</strong> durante el proceso de inspección física y análisis químico.
                    </p>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100 flex justify-end">
                    <Button 
                        onClick={handleInadequateReport} 
                        isLoading={generatingPdf} 
                        variant="outline"
                        className="h-14 px-8 border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-2xl"
                    >
                        <Download className="h-5 w-5 mr-2" />
                        Exportar Reporte de Calidad
                    </Button>
                </div>
            </div>
        </div>
      </div>

      {/* FREQUENCY TABLE (Read Only Sync) */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Percent className="h-6 w-6 text-primary-500" />
                Resumen de Calidad por Periodo
            </h3>
            <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">
                Sincronizado: {new Date().toLocaleTimeString()}
            </span>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin mb-4" />
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Consolidando bases de datos...</p>
            </div>
        ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-200 text-[10px]">
                    <thead className="bg-slate-50">
                        <tr className="font-black text-slate-500 uppercase tracking-widest">
                            <th className="px-6 py-4 text-left">Unidad Médica</th>
                            <th className="px-6 py-4 text-left">Periodo</th>
                            <th className="px-4 py-4 text-center text-red-600 bg-red-50/50">Acidez</th>
                            <th className="px-4 py-4 text-center text-red-600 bg-red-50/50">Envase</th>
                            <th className="px-4 py-4 text-center text-red-600 bg-red-50/50">Microb.</th>
                            <th className="px-6 py-4 text-center border-l-2 border-slate-200 bg-slate-100 text-slate-900">Total</th>
                            <th className="px-6 py-4 text-center text-slate-400">Analizadas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredFreq.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-slate-400 font-medium">Sin datos para el rango seleccionado.</td></tr>
                        ) : filteredFreq.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-900">{row.unidad_medica}</td>
                                <td className="px-6 py-4 font-bold text-slate-500">{row.mes_anio}</td>
                                <td className="px-4 py-4 text-center bg-red-50/20 font-black text-red-700">{row.num_rechazos_acidez}</td>
                                <td className="px-4 py-4 text-center bg-red-50/20 font-black text-red-700">{row.num_rechazos_envase}</td>
                                <td className="px-4 py-4 text-center bg-red-50/20 font-black text-red-700">{row.num_rechazos_suciedad}</td>
                                <td className="px-6 py-4 text-center border-l-2 border-slate-200 bg-slate-50 font-black text-slate-900 text-xs">{row.total_muestras_inadecuadas}</td>
                                <td className="px-6 py-4 text-center font-bold text-slate-400">{row.total_muestras_analizadas}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
};

const InfoIcon = ({className}: {className?: string}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
