
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, Search, CheckCircle2, AlertCircle, Edit, FlaskConical, ListChecks } from 'lucide-react';
import { batchService } from '../services/batchService';
import { Batch, Bottle } from '../types';
import { Button } from '../components/ui/Button';

export const QualityControlList: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchService.getAll();
      setBatches(data.sort((a,b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'IN_PROCESS':
              return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-900 border border-blue-200 uppercase">En Proceso</span>;
          case 'COMPLETED':
              return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-900 border border-yellow-200 uppercase">Conformado</span>;
          case 'PENDING_QC':
               return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200 uppercase">Analizando Frascos</span>;
          case 'APPROVED':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase">Liberado</span>;
          case 'REJECTED':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-900 border border-red-200 uppercase">Bloqueado / Rechazado</span>;
          default:
              return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-800 border border-gray-200 uppercase">{status}</span>;
      }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Módulo de Control de Calidad</h1>
          <p className="mt-2 text-base text-slate-600">Validación de seguridad biológica por unidad individual de lote.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {loading ? (
              <div className="p-24 text-center text-slate-400 font-bold animate-pulse">Sincronizando registros de laboratorio...</div>
          ) : batches.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
                  <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-700">No hay lotes pendientes de análisis.</p>
              </div>
          ) : (
              batches.map((batch) => (
                  <div key={batch.id} className={`bg-white rounded-3xl border-2 transition-all p-8 flex flex-col md:flex-row items-center gap-8 ${batch.status === 'REJECTED' ? 'border-red-100' : 'border-slate-100 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-50'}`}>
                      <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                          <FlaskConical className="h-8 w-8" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                              <h3 className="text-xl font-black text-slate-900 truncate">{batch.batchNumber}</h3>
                              {getStatusBadge(batch.status)}
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-500 uppercase tracking-tighter">
                              <span className="flex items-center gap-1.5"><ListChecks className="h-4 w-4" /> {batch.bottleCount} Frascos</span>
                              <span>Tipo: {batch.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'}</span>
                              <span>Volumen: {batch.totalVolume} ml</span>
                              <span>Registrado: {batch.creationDate}</span>
                          </div>
                      </div>

                      <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
                          <Button 
                              className={`w-full md:w-56 h-14 font-black uppercase text-base shadow-lg ${['IN_PROCESS', 'COMPLETED', 'PENDING_QC'].includes(batch.status) ? 'bg-primary-600 hover:bg-primary-700' : 'bg-slate-800'}`}
                              onClick={() => navigate(`/quality-control/batch/${batch.id}`)}
                          >
                              {['IN_PROCESS', 'COMPLETED', 'PENDING_QC'].includes(batch.status) ? (
                                  <>Analizar Frascos <ChevronRight className="h-5 w-5 ml-2" /></>
                              ) : (
                                  <>Ver Resultados <Eye className="h-5 w-5 ml-2" /></>
                              )}
                          </Button>
                          {batch.status === 'REJECTED' && (
                              <p className="text-[10px] font-black text-red-600 flex items-center gap-1 uppercase tracking-tighter">
                                  <AlertCircle className="h-3 w-3" /> Lote bloqueado por no aptitud
                              </p>
                          )}
                      </div>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

const ChevronRight = ({className}: {className?: string}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
