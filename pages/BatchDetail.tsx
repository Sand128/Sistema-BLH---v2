
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, CheckCircle, XCircle, FlaskConical, Milk, 
  ClipboardCheck, AlertTriangle, Syringe, Baby, ArrowDown, 
  User, Calendar, Clock, Eye, Archive, ThermometerSnowflake,
  Activity, Droplets, CheckSquare, Search
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { recipientService } from '../services/recipientService';
import { Batch, Bottle, AdministrationRecord } from '../types';
import { Button } from '../components/ui/Button';

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Data States
  const [batch, setBatch] = useState<Batch | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [administrations, setAdministrations] = useState<AdministrationRecord[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (batchId: string) => {
    try {
      const batchData = await batchService.getById(batchId);
      if (batchData) {
        setBatch(batchData);
        const [bottleData, adminsData] = await Promise.all([
          batchService.getBottlesByBatchId(batchId),
          recipientService.getByBatchId(batchId)
        ]);
        setBottles(bottleData);
        setAdministrations(adminsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'COMPLETED' | 'CANCELLED') => {
    if (!batch || !confirm(`¿Está seguro de cambiar el estado a ${newStatus}?`)) return;
    setUpdating(true);
    try {
      await batchService.updateStatus(batch.id, newStatus);
      setBatch({ ...batch, status: newStatus });
    } catch (error) {
      console.error(error);
      alert('Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando trazabilidad del lote...</div>;
  if (!batch) return <div className="p-8 text-center text-red-500">Lote no encontrado</div>;

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      IN_PROCESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      PENDING_QC: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${styles[status] || styles.IN_PROCESS}`}>
        {status}
      </span>
    );
  };

  const DetailRow = ({ label, value, icon: Icon }: any) => (
      <div className="flex items-start gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />}
          <div>
              <span className="font-black text-slate-500 text-[10px] uppercase tracking-widest block">{label}</span>
              <span className="text-slate-900 font-bold text-sm">{value}</span>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/batches')} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-slate-100">
            <ChevronLeft className="h-8 w-8" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{batch.batchNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={batch.status} />
                <span className="text-xs font-bold text-slate-400">Expediente de Trazabilidad Unificada</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {['IN_PROCESS', 'COMPLETED', 'PENDING_QC'].includes(batch.status) && (
             <Button 
                variant="primary" 
                className="bg-primary-600 hover:bg-primary-700 h-12 shadow-lg"
                onClick={() => navigate(`/quality-control/batch/${batch.id}`)}
             >
                <ClipboardCheck className="h-5 w-5 mr-2" /> Gestionar Análisis
             </Button>
          )}
          {batch.status === 'APPROVED' && batch.currentVolume > 0 && (
             <Button variant="primary" className="bg-teal-600 hover:bg-teal-700 h-12 shadow-lg" onClick={() => navigate('/administration', { state: { batchId: batch.id } })}>
                <Syringe className="h-5 w-5 mr-2" /> Administrar
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LOTE MASTER DATA */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Información del Lote</h3>
                  <div className="grid grid-cols-1 gap-4">
                      <DetailRow label="Tipo de Donación" value={batch.type === 'HOMOLOGOUS' ? 'Homóloga' : 'Heteróloga'} />
                      <DetailRow label="Volumen Total" value={`${batch.totalVolume} ml`} icon={FlaskConical} />
                      <DetailRow label="Disponible" value={`${batch.currentVolume} ml`} />
                      <DetailRow label="Fecha Creación" value={batch.creationDate} icon={Calendar} />
                      {batch.status === 'APPROVED' && <DetailRow label="Fecha Vencimiento" value={batch.expirationDate || 'N/A'} icon={Clock} />}
                  </div>
              </div>

              {batch.status === 'REJECTED' && (
                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-3xl flex items-start gap-4">
                      <AlertTriangle className="h-8 w-8 text-red-600 flex-shrink-0" />
                      <div>
                          <h4 className="text-sm font-black text-red-900 uppercase tracking-widest">Lote Bloqueado</h4>
                          <p className="text-xs text-red-700 mt-1 font-bold">Inconsistencias de calidad detectadas a nivel de unidad. El lote ha sido descartado de la cadena de pasteurización.</p>
                      </div>
                  </div>
              )}
          </div>

          {/* BOTTLES TRAJECTORY */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Trazabilidad de Frascos ({bottles.length})</h3>
                      <Link to={`/quality-control/batch/${batch.id}`} className="text-xs font-black text-primary-600 hover:underline uppercase">Ver análisis detalle</Link>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50/50 border-b border-slate-100">
                              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                  <th className="px-6 py-4">Folio / Donadora</th>
                                  <th className="px-6 py-4">Física</th>
                                  <th className="px-6 py-4">Química</th>
                                  <th className="px-6 py-4">Dictamen</th>
                                  <th className="px-6 py-4 text-right">Volumen</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {bottles.map(bottle => (
                                  <tr key={bottle.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-6 py-4">
                                          <p className="text-xs font-black text-slate-900">{bottle.traceabilityCode}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">{bottle.donorName}</p>
                                      </td>
                                      <td className="px-6 py-4">
                                          {bottle.physicalInspectionId ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-200" />}
                                      </td>
                                      <td className="px-6 py-4">
                                          {bottle.qualityControlId ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Clock className="h-5 w-5 text-slate-200" />}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                              bottle.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                              bottle.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-slate-100 text-slate-500 border-slate-200'
                                          }`}>
                                              {bottle.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className="text-sm font-black text-slate-900">{bottle.volume} ml</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* DISTRIBUCIÓN */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Registro de Salidas (Distribución)</h3>
                  </div>
                  {administrations.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest italic">Lote sin registros de administración</div>
                  ) : (
                      <div className="p-6 space-y-4">
                          {administrations.map(adm => (
                              <div key={adm.id} className="flex justify-between items-center bg-teal-50/30 p-4 rounded-2xl border border-teal-100">
                                  <div>
                                      <Link to={`/recipients/${adm.recipientId}`} className="text-sm font-black text-teal-900 hover:underline">{adm.recipientName}</Link>
                                      <p className="text-[10px] font-bold text-teal-600 uppercase mt-0.5">{new Date(adm.date).toLocaleString()} • Por: {adm.administeredBy}</p>
                                  </div>
                                  <span className="text-lg font-black text-teal-700">{adm.volumeAdministered} ml</span>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

const CheckCircle2 = ({className}: {className?: string}) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
