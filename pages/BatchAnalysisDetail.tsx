
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, FlaskConical, Beaker, CheckCircle2, XCircle, 
  AlertTriangle, Eye, ClipboardCheck, Info, Droplets
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { Batch, Bottle } from '../types';
import { Button } from '../components/ui/Button';

export const BatchAnalysisDetail: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (batchId) {
      loadData(batchId);
    }
  }, [batchId]);

  const loadData = async (id: string) => {
    const b = await batchService.getById(id);
    if (b) {
      setBatch(b);
      const btls = await batchService.getBottlesByBatchId(id);
      setBottles(btls);
    }
    setLoading(false);
  };

  if (loading) return <div className="p-12 text-center text-slate-500 animate-pulse">Cargando frascos para análisis...</div>;
  if (!batch) return <div className="p-12 text-center text-red-600 font-bold">Lote no encontrado</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/quality-control')} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900">Análisis Individual por Frasco</h1>
          <p className="text-base text-slate-500 mt-1">Lote: <span className="font-black text-primary-600">{batch.batchNumber}</span> • {bottles.length} unidades totales</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-start gap-4">
          <Info className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
              <p className="font-black uppercase tracking-wider mb-1">Instrucción de Calidad</p>
              <p>Cada frasco debe completar la inspección física y el análisis químico de forma independiente. El lote no podrá avanzar a liberación si un frasco está pendiente o es rechazado sin gestión de destino.</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bottles.map((bottle) => (
              <div key={bottle.id} className={`bg-white rounded-2xl shadow-sm border-2 transition-all p-6 flex flex-col justify-between ${
                  bottle.status === 'REJECTED' ? 'border-red-200 bg-red-50/10' : 
                  bottle.status === 'APPROVED' ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
              }`}>
                  <div>
                      <div className="flex justify-between items-start mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{bottle.traceabilityCode}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                              bottle.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              bottle.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                              'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                              {bottle.status === 'COLLECTED' || bottle.status === 'ASSIGNED' ? 'Pendiente' : bottle.status}
                          </span>
                      </div>
                      
                      <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{bottle.donorName}</h4>
                      <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-2">
                        <Droplets className="h-3.5 w-3.5" /> {bottle.volume} ml • {bottle.milkType}
                      </p>

                      <div className="space-y-3 pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase">Inspección Física</span>
                              {bottle.physicalInspectionId ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                              )}
                          </div>
                          <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase">Análisis Químico</span>
                              {bottle.qualityControlId ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                              ) : (
                                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 flex gap-2">
                      <Button 
                          variant="outline" 
                          className="flex-1 text-[10px] h-10 px-0 font-black uppercase border-slate-200 hover:bg-slate-50"
                          onClick={() => navigate(`/quality-control/physical/${batchId}/${bottle.id}`)}
                      >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Física
                      </Button>
                      <Button 
                          variant="secondary" 
                          className={`flex-1 text-[10px] h-10 px-0 font-black uppercase ${!bottle.physicalInspectionId ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                          disabled={!bottle.physicalInspectionId}
                          onClick={() => navigate(`/quality-control/${batchId}/${bottle.id}`)}
                      >
                          <ClipboardCheck className="h-3.5 w-3.5 mr-1" /> Química
                      </Button>
                  </div>
              </div>
          ))}
      </div>
      
      {batch.status === 'REJECTED' && (
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl flex items-center gap-4 animate-in zoom-in-95">
              <XCircle className="h-10 w-10 text-red-600 flex-shrink-0" />
              <div>
                  <h4 className="text-lg font-black text-red-900 uppercase">Lote Bloqueado</h4>
                  <p className="text-sm text-red-700">Se han detectado frascos NO APTOS. El lote no puede avanzar a pasteurización hasta que se descarte el material comprometido y el resto de las unidades sean aprobadas.</p>
              </div>
          </div>
      )}
    </div>
  );
};
