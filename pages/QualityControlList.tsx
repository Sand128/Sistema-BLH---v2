
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Eye, Search, CheckCircle2, AlertCircle, Edit } from 'lucide-react';
import { batchService } from '../services/batchService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';

export const QualityControlList: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchService.getAll();
      // Mostramos todos los lotes, pero ordenados por fecha.
      // Los botones de acción se ocultarán condicionalmente para los finalizados.
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
              return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">En Proceso</span>;
          case 'COMPLETED':
              return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-900 border border-yellow-200">Listo p/ Inspección</span>;
          case 'PENDING_QC':
               return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">En Análisis Químico</span>;
          case 'APPROVED':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-200">Aprobado</span>;
          case 'REJECTED':
                return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-200">Rechazado</span>;
          default:
              return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">{status}</span>;
      }
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Control de Calidad</h1>
          <p className="mt-2 text-base text-slate-600">Gestión de análisis y trazabilidad de lotes.</p>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-base font-bold text-slate-800">Listado General de Lotes</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lote ID
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Volumen
                </th>
                 <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Estado Actual
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Cargando lotes...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                        <ClipboardCheck className="h-12 w-12 text-slate-300 mb-2" />
                        <p className="text-lg font-medium text-slate-700">No hay lotes registrados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const hasPhysicalInspection = !!batch.physicalInspectionId;
                  
                  // Definición de "En Proceso" para visibilidad de botones:
                  // Incluye: IN_PROCESS (recién creado), COMPLETED (listo para inspección), PENDING_QC (inspeccionado físicamente)
                  const isActiveWorkflow = ['IN_PROCESS', 'COMPLETED', 'PENDING_QC'].includes(batch.status);
                  
                  return (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-base font-bold text-slate-900">
                        {batch.batchNumber}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {new Date(batch.creationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {batch.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base font-bold text-slate-900">
                      {batch.totalVolume} ml
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                            {getStatusBadge(batch.status)}
                            {hasPhysicalInspection && isActiveWorkflow && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700 border border-green-100 w-fit">
                                    Física Aprobada
                                </span>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        
                        {/* BOTONES DE ACCIÓN - VISIBLES SOLO SI EL ESTADO ES "EN PROCESO" */}
                        
                        {isActiveWorkflow && (
                          <>
                            {/* 1. Registrar inspección física */}
                            {/* Visible si está completado (listo) o en proceso, y no tiene inspección aún */}
                            {!hasPhysicalInspection && (
                                <Link to={`/quality-control/physical/${batch.id}`}>
                                  <Button variant="secondary" className="text-xs px-3 py-2 bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200 shadow-none">
                                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Insp. Física
                                  </Button>
                                </Link>
                            )}

                            {/* 2. Registrar análisis fisicoquímico */}
                            {/* Visible solo si ya pasó la física y está pendiente de QC químico */}
                            {hasPhysicalInspection && batch.status === 'PENDING_QC' && (
                                <Link to={`/quality-control/${batch.id}`}>
                                  <Button variant="secondary" className="text-xs px-3 py-2">
                                    <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" /> Análisis Químico
                                  </Button>
                                </Link>
                            )}

                            {/* 3. Editar registro */}
                            <Link to={`/batches/${batch.id}`}>
                                <Button variant="outline" className="text-xs px-3 py-2 border-slate-300 text-slate-600 hover:bg-slate-50">
                                    <Edit className="h-3.5 w-3.5 mr-1.5" /> Editar registro
                                </Button>
                            </Link>
                          </>
                        )}

                        {/* Si NO está en proceso (Finalizado), mostramos solo "Ver" o nada */}
                        {!isActiveWorkflow && (
                            <Link to={`/batches/${batch.id}`}>
                                <Button variant="outline" className="text-xs px-3 py-2 border-slate-200 text-slate-400 hover:text-slate-600">
                                    <Eye className="h-3.5 w-3.5 mr-1.5" /> Ver Detalle
                                </Button>
                            </Link>
                        )}

                      </div>
                    </td>
                  </tr>
                )}) 
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
