
import React, { useState, useEffect } from 'react';
import { Download, Printer, Filter, Calendar, FileUp, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { donorService } from '../services/donorService';
import { batchService } from '../services/batchService';
import { reportService } from '../services/reportService';
import { pdfService } from '../services/pdfService';
import { Donor, Batch } from '../types';

type ReportTab = 'DONORS' | 'PRODUCTION' | 'DISTRIBUTION';

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('DONORS');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data States
  const [donors, setDonors] = useState<Donor[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Template Upload State
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateSuccess, setTemplateSuccess] = useState(false);

  useEffect(() => {
    // Ideally fetch based on date range, here we fetch all and filter client side for V1
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dData, bData] = await Promise.all([
          donorService.getAll(),
          batchService.getAll()
        ]);
        setDonors(dData);
        setBatches(bData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter Logic
  const filteredDonors = donors.filter(d => 
    d.registrationDate >= startDate && d.registrationDate <= endDate
  );
  
  const filteredBatches = batches.filter(b => 
    b.creationDate >= startDate && b.creationDate <= endDate
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (activeTab === 'DONORS') {
      const exportData = filteredDonors.map(d => ({
        ID: d.id,
        Nombre: `${d.firstName} ${d.lastName}`,
        Email: d.email,
        Telefono: d.phone,
        FechaRegistro: d.registrationDate,
        Estado: d.status,
        TipoSangre: d.bloodType
      }));
      reportService.downloadCSV(exportData, `Reporte_Donadoras_${startDate}_${endDate}`);
    } else if (activeTab === 'PRODUCTION') {
      const exportData = filteredBatches.map(b => ({
        Lote: b.batchNumber,
        Fecha: b.creationDate,
        Tipo: b.type,
        VolumenTotal: b.totalVolume,
        Frascos: b.bottleCount,
        Estado: b.status
      }));
      reportService.downloadCSV(exportData, `Reporte_Produccion_${startDate}_${endDate}`);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setUploadingTemplate(true);
          setTemplateSuccess(false);
          try {
              await pdfService.saveTemplate(e.target.files[0]);
              setTemplateSuccess(true);
              setTimeout(() => setTemplateSuccess(false), 3000);
          } catch (error) {
              alert('Error al subir la plantilla.');
          } finally {
              setUploadingTemplate(false);
          }
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="mt-1 text-sm text-gray-500">Generación de informes institucionales.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handlePrint}>
             <Printer className="h-4 w-4 mr-2" />
             Imprimir / PDF
           </Button>
           <Button onClick={handleExport}>
             <Download className="h-4 w-4 mr-2" />
             Exportar Excel
           </Button>
        </div>
      </div>

      {/* Admin Config Section (Only visible on screen) */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 no-print flex items-center justify-between">
          <div>
              <h3 className="text-sm font-bold text-slate-800">Configuración de Documentos</h3>
              <p className="text-xs text-slate-500">Actualizar plantilla base para Consentimiento Informado.</p>
          </div>
          <div className="flex items-center gap-3">
              {templateSuccess && <span className="text-xs text-green-600 font-bold flex items-center"><Check className="h-3 w-3 mr-1"/> Actualizado</span>}
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                  <FileUp className="h-4 w-4 mr-2 text-slate-500" />
                  {uploadingTemplate ? 'Subiendo...' : 'Subir Plantilla PDF'}
                  <input type="file" accept="application/pdf" className="hidden" onChange={handleTemplateUpload} disabled={uploadingTemplate} />
              </label>
          </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 no-print">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full rounded-md border-[#C6C6C6] bg-[#F2F4F7] text-[#333333] shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full rounded-md border-[#C6C6C6] bg-[#F2F4F7] text-[#333333] shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
            />
          </div>
          <div className="flex-1" />
          <div className="text-sm text-gray-500">
             Mostrando datos del <strong>{startDate}</strong> al <strong>{endDate}</strong>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 no-print">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('DONORS')}
            className={`${
              activeTab === 'DONORS'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Donadoras
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTION')}
            className={`${
              activeTab === 'PRODUCTION'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Producción y Calidad
          </button>
           <button
            onClick={() => setActiveTab('DISTRIBUTION')}
            className={`${
              activeTab === 'DISTRIBUTION'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Distribución (Simulado)
          </button>
        </nav>
      </div>

      {/* Report Content */}
      <div className="bg-white shadow rounded-lg border border-gray-200 min-h-[500px] p-6 print:shadow-none print:border-none">
        
        {/* Header for Print */}
        <div className="hidden print:block mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold">Banco de Leche Humana - Reporte Institucional</h1>
            <p className="text-sm">Período: {startDate} - {endDate}</p>
            <p className="text-sm">Generado el: {new Date().toLocaleString()}</p>
        </div>

        {loading ? (
           <p className="text-center text-gray-500 py-10">Generando reporte...</p>
        ) : (
          <>
            {activeTab === 'DONORS' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Registro de Nuevas Donadoras</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo Sangre</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha Registro</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredDonors.length === 0 ? (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay datos en este período</td></tr>
                      ) : filteredDonors.map((d) => (
                        <tr key={d.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{d.firstName} {d.lastName}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{d.bloodType}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{d.registrationDate}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{d.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 print:grid-cols-3">
                   <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm text-gray-500">Total Nuevas</p>
                      <p className="text-2xl font-bold">{filteredDonors.length}</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded border">
                      <p className="text-sm text-gray-500">Activas en Periodo</p>
                      <p className="text-2xl font-bold">{filteredDonors.filter(d => d.status === 'ACTIVE').length}</p>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'PRODUCTION' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Producción de Lotes</h3>
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Lote</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Fecha</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Volumen</th>
                         <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredBatches.length === 0 ? (
                        <tr><td colSpan={5} className="p-4 text-center text-gray-500">No hay datos en este período</td></tr>
                      ) : filteredBatches.map((b) => (
                        <tr key={b.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{b.batchNumber}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{b.creationDate}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{b.type}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{b.totalVolume} ml</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{b.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                   <div className="bg-blue-50 p-4 rounded border border-blue-100">
                      <p className="text-sm text-blue-800">Total Lotes</p>
                      <p className="text-2xl font-bold text-blue-900">{filteredBatches.length}</p>
                   </div>
                   <div className="bg-green-50 p-4 rounded border border-green-100">
                      <p className="text-sm text-green-800">Volumen Procesado</p>
                      <p className="text-2xl font-bold text-green-900">
                        {filteredBatches.reduce((sum, b) => sum + b.totalVolume, 0) / 1000} L
                      </p>
                   </div>
                   <div className="bg-purple-50 p-4 rounded border border-purple-100">
                      <p className="text-sm text-purple-800">Tasa Aprobación</p>
                      <p className="text-2xl font-bold text-purple-900">
                         {filteredBatches.length ? Math.round((filteredBatches.filter(b => b.status === 'APPROVED').length / filteredBatches.length) * 100) : 0}%
                      </p>
                   </div>
                </div>
              </div>
            )}
            
            {activeTab === 'DISTRIBUTION' && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <p className="mb-2">Módulo de reporte detallado de distribución en desarrollo para Fase 2.</p>
                    <p className="text-sm">Consulte el Dashboard principal para tendencias generales.</p>
                </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .shadow { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};
