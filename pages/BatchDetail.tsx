
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, CheckCircle, XCircle, FlaskConical, Milk, 
  ClipboardCheck, AlertTriangle, Syringe, Baby, ArrowDown, 
  User, Calendar, Clock, Eye, Archive, ThermometerSnowflake
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { recipientService } from '../services/recipientService';
import { Batch, Bottle, QualityControlRecord, AdministrationRecord, PhysicalInspectionRecord } from '../types';
import { Button } from '../components/ui/Button';

export const BatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Data States
  const [batch, setBatch] = useState<Batch | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [qcRecord, setQcRecord] = useState<QualityControlRecord | undefined>(undefined);
  const [physicalRecord, setPhysicalRecord] = useState<PhysicalInspectionRecord | undefined>(undefined);
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
        
        // Parallel fetching for related data
        const [bottleData, qcData, physData, adminsData] = await Promise.all([
          batchService.getBottlesByBatchId(batchId),
          batchData.qualityControlId ? batchService.getQCRecord(batchId) : Promise.resolve(undefined),
          batchData.physicalInspectionId ? batchService.getPhysicalQCRecord(batchId) : Promise.resolve(undefined),
          recipientService.getByBatchId(batchId)
        ]);

        setBottles(bottleData);
        setQcRecord(qcData);
        setPhysicalRecord(physData);
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
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      PENDING_QC: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.IN_PROCESS}`}>
        {status === 'COMPLETED' ? 'Listo para Insp.' : status}
      </span>
    );
  };

  // --- Components for Traceability Timeline ---
  
  const TimelineNode = ({ 
      icon: Icon, 
      title, 
      date, 
      status, 
      children, 
      isLast = false,
      statusColor = 'blue' 
  }: any) => {
      const colorClasses: any = {
          blue: 'bg-blue-100 text-blue-600 border-blue-200',
          green: 'bg-green-100 text-green-600 border-green-200',
          red: 'bg-red-100 text-red-600 border-red-200',
          orange: 'bg-orange-100 text-orange-600 border-orange-200',
          gray: 'bg-slate-100 text-slate-500 border-slate-200'
      };

      const dotClass = colorClasses[statusColor] || colorClasses.gray;

      return (
          <div className="relative pl-8 sm:pl-12 py-2 group">
              {/* Connector Line */}
              {!isLast && (
                  <div className="absolute left-[15px] sm:left-[23px] top-10 bottom-0 w-0.5 bg-slate-200 group-hover:bg-slate-300 transition-colors"></div>
              )}
              
              {/* Icon Dot */}
              <div className={`absolute left-0 top-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center z-10 shadow-sm ${dotClass}`}>
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
              </div>

              {/* Content Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <div>
                          <h4 className="text-base font-bold text-slate-800">{title}</h4>
                          {date && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {new Date(date).toLocaleString()}
                              </p>
                          )}
                      </div>
                      {status && (
                          <div className="mt-2 sm:mt-0">
                             {status}
                          </div>
                      )}
                  </div>
                  <div className="text-sm text-slate-600 space-y-2">
                      {children}
                  </div>
              </div>
          </div>
      );
  };

  const DetailRow = ({ label, value, icon: Icon }: any) => (
      <div className="flex items-start gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />}
          <div>
              <span className="font-semibold text-slate-700 text-xs uppercase">{label}: </span>
              <span className="text-slate-900">{value}</span>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/batches')} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-slate-100">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{batch.batchNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-gray-500">Expediente Digital de Trazabilidad</p>
                <StatusBadge status={batch.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {batch.status === 'IN_PROCESS' && (
            <>
              <Button variant="danger" onClick={() => handleStatusChange('CANCELLED')} isLoading={updating}>
                <XCircle className="h-4 w-4 mr-2" /> Cancelar Lote
              </Button>
              <Button variant="primary" onClick={() => handleStatusChange('COMPLETED')} isLoading={updating} className="bg-blue-600 hover:bg-blue-700">
                <CheckCircle className="h-4 w-4 mr-2" /> Finalizar (Cerrar Lote)
              </Button>
            </>
          )}
          
          {(batch.status === 'COMPLETED' || batch.status === 'PENDING_QC') && (
            <div className="flex gap-2">
               {!physicalRecord && (
                   <Link to={`/quality-control/physical/${batch.id}`}>
                      <Button variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                          <Eye className="h-4 w-4 mr-2" /> Insp. Física
                      </Button>
                   </Link>
               )}
               {physicalRecord && !qcRecord && (
                  <Link to={`/quality-control/${batch.id}`}>
                      <Button variant="primary">
                          <ClipboardCheck className="h-4 w-4 mr-2" /> Análisis Químico
                      </Button>
                  </Link>
               )}
            </div>
          )}

          {batch.status === 'APPROVED' && batch.currentVolume > 0 && (
             <Button 
                variant="primary" 
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => navigate('/administration', { state: { batchId: batch.id } })}
             >
                <Syringe className="h-4 w-4 mr-2" /> Administrar
             </Button>
          )}
        </div>
      </div>

      {/* --- TRACEABILITY DIAGRAM --- */}
      <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b pb-2">
              <FlaskConical className="h-5 w-5 mr-2 text-pink-500" />
              Flujo de Trazabilidad del Lote
          </h3>

          <div className="space-y-0">
              
              {/* STEP 1: ORIGIN (Donors/Collection) */}
              <TimelineNode 
                  icon={User} 
                  title="Origen (Donantes y Recolección)" 
                  statusColor="blue"
                  date={bottles.length > 0 ? bottles[0].collectionDate : undefined} // Most recent collection
              >
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Frascos Recolectados ({bottles.length})</p>
                      <ul className="space-y-2">
                          {bottles.map(bottle => (
                              <li key={bottle.id} className="flex justify-between items-start text-sm border-b border-slate-200 last:border-0 pb-1 last:pb-0">
                                  <div>
                                      <Link to={`/donors/${bottle.donorId}`} className="font-medium text-blue-600 hover:underline">
                                          {bottle.donorName}
                                      </Link>
                                      <p className="text-xs text-slate-500">ID: {bottle.traceabilityCode}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="font-bold text-slate-700">{bottle.volume} ml</span>
                                      <p className="text-[10px] text-slate-400">{bottle.hospitalInitials}</p>
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                       <DetailRow label="Volumen Total Recolectado" value={`${batch.totalVolume} ml`} icon={FlaskConical} />
                       <DetailRow label="Tipo Donación" value={batch.type === 'HOMOLOGOUS' ? 'Homóloga' : 'Heteróloga'} />
                  </div>
              </TimelineNode>

              {/* STEP 2: BATCH CREATION */}
              <TimelineNode 
                  icon={FlaskConical} 
                  title="Conformación del Lote" 
                  date={batch.creationDate}
                  statusColor="blue"
                  status={<span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">REGISTRADO</span>}
              >
                   <DetailRow label="ID Lote" value={batch.batchNumber} />
                   <DetailRow label="Estado Inicial" value="En Proceso / Crudo" />
              </TimelineNode>

              {/* STEP 3: PHYSICAL INSPECTION */}
              {physicalRecord ? (
                  <TimelineNode 
                      icon={Eye} 
                      title="Inspección Física" 
                      date={physicalRecord.inspectionDate}
                      statusColor={physicalRecord.verdict === 'APPROVED' ? 'green' : 'red'}
                      status={
                          <span className={`text-xs font-bold px-2 py-1 rounded ${physicalRecord.verdict === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {physicalRecord.verdict === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'}
                          </span>
                      }
                  >
                      <div className="grid grid-cols-2 gap-2">
                          <DetailRow label="Responsable" value={physicalRecord.inspectorName} />
                          <DetailRow label="Volumen Verificado" value={`${physicalRecord.volumeCheck} ml`} />
                          <DetailRow label="Estado Envase" value={physicalRecord.containerState.integrity ? 'Íntegro' : 'Dañado'} />
                          <DetailRow label="Estado Térmico" value={physicalRecord.milkState} />
                      </div>
                      {physicalRecord.verdict === 'REJECTED' && physicalRecord.rejectionReasons.length > 0 && (
                          <div className="mt-2 bg-red-50 p-2 rounded border border-red-100">
                              <p className="text-xs font-bold text-red-800 uppercase">Motivos de Rechazo:</p>
                              <ul className="list-disc list-inside text-xs text-red-700 mt-1">
                                  {physicalRecord.rejectionReasons.map((r, i) => <li key={i}>{r}</li>)}
                              </ul>
                          </div>
                      )}
                      {physicalRecord.observations && (
                          <p className="text-xs text-slate-500 mt-2 italic">"{physicalRecord.observations}"</p>
                      )}
                  </TimelineNode>
              ) : (
                  <TimelineNode icon={Eye} title="Inspección Física" statusColor="gray" status={<span className="text-xs text-slate-400 font-medium">PENDIENTE</span>}>
                      <p className="text-sm text-slate-400">Esperando inspección sensorial y de envase.</p>
                  </TimelineNode>
              )}

              {/* STEP 4: CHEMICAL ANALYSIS */}
              {qcRecord ? (
                  <TimelineNode 
                      icon={ClipboardCheck} 
                      title="Análisis Fisicoquímico" 
                      date={qcRecord.inspectionDate}
                      statusColor={qcRecord.verdict === 'APPROVED' ? 'green' : 'red'}
                      status={
                          <span className={`text-xs font-bold px-2 py-1 rounded ${qcRecord.verdict === 'APPROVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {qcRecord.verdict === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'}
                          </span>
                      }
                  >
                      <div className="grid grid-cols-2 gap-2">
                          <DetailRow label="Responsable" value={qcRecord.inspectorName} />
                          <DetailRow label="Acidez Dornic" value={`${qcRecord.acidityDornic} °D`} />
                          <DetailRow label="Crematocrito" value={`${qcRecord.crematocrit} Kcal/L`} />
                          <DetailRow label="Coliformes" value={qcRecord.coliformsPresence ? 'POSITIVO' : 'Negativo'} />
                      </div>
                      {qcRecord.verdict === 'REJECTED' && (
                          <div className="mt-2 bg-red-50 p-2 rounded border border-red-100 text-xs text-red-700">
                             El lote no cumple con los estándares de calidad fisicoquímica.
                          </div>
                      )}
                  </TimelineNode>
              ) : (
                  <TimelineNode icon={ClipboardCheck} title="Análisis Fisicoquímico" statusColor="gray" status={<span className="text-xs text-slate-400 font-medium">PENDIENTE</span>}>
                      <p className="text-sm text-slate-400">Esperando resultados de laboratorio.</p>
                  </TimelineNode>
              )}

              {/* STEP 5: STORAGE / INVENTORY */}
              {batch.status === 'APPROVED' || batch.status === 'PASTEURIZED' ? (
                  <TimelineNode 
                      icon={Archive} 
                      title="Almacenamiento (Cadena de Frío)" 
                      statusColor="green"
                      status={<span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded">DISPONIBLE</span>}
                  >
                       <DetailRow label="Volumen Actual" value={`${batch.currentVolume} ml`} icon={FlaskConical} />
                       <DetailRow label="Vencimiento" value={batch.expirationDate} icon={Calendar} />
                       <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded border border-green-100 flex items-center gap-2">
                           <ThermometerSnowflake className="h-4 w-4" />
                           Lote almacenado a -20°C
                       </div>
                  </TimelineNode>
              ) : (
                   batch.status === 'REJECTED' ? (
                       <TimelineNode icon={Archive} title="Almacenamiento" statusColor="red">
                           <p className="text-sm text-red-600 font-medium">Lote Descartado - No almacenado</p>
                       </TimelineNode>
                   ) : (
                       <TimelineNode icon={Archive} title="Almacenamiento" statusColor="gray">
                           <p className="text-sm text-slate-400">Pendiente de aprobación de calidad.</p>
                       </TimelineNode>
                   )
              )}

              {/* STEP 6: DISTRIBUTION / RECIPIENTS */}
              <TimelineNode 
                  icon={Baby} 
                  title="Receptor (Distribución)" 
                  statusColor={administrations.length > 0 ? 'orange' : 'gray'}
                  isLast={true}
              >
                  {administrations.length > 0 ? (
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                          <p className="text-xs font-bold text-orange-800 uppercase mb-2">Salidas Registradas ({administrations.length})</p>
                          <ul className="space-y-3">
                              {administrations.map(adm => (
                                  <li key={adm.id} className="border-b border-orange-200 last:border-0 pb-2 last:pb-0">
                                      <div className="flex justify-between">
                                          <Link to={`/recipients/${adm.recipientId}`} className="font-bold text-slate-800 text-sm hover:underline">
                                              {adm.recipientName}
                                          </Link>
                                          <span className="font-bold text-orange-700 text-sm">{adm.volumeAdministered} ml</span>
                                      </div>
                                      <div className="flex justify-between mt-1 text-xs text-slate-600">
                                          <span>{new Date(adm.date).toLocaleString()}</span>
                                          <span>Por: {adm.administeredBy}</span>
                                      </div>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ) : (
                       <p className="text-sm text-slate-500 italic">No se ha administrado leche de este lote aún.</p>
                  )}
              </TimelineNode>

          </div>
      </div>
    </div>
  );
};
