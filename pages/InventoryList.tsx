import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, Syringe, Trash2, AlertCircle } from 'lucide-react';
import { batchService } from '../services/batchService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';

export const InventoryList: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await batchService.getAll();
      // Filter only APPROVED batches with positive volume
      const available = data.filter(b => b.status === 'APPROVED' && b.currentVolume > 0);
      setBatches(available.sort((a,b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime())); // Oldest first (FIFO)
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (batchId: string) => {
      const amount = prompt("Ingrese la cantidad a descartar (ml):");
      if(!amount) return;
      const vol = Number(amount);
      if(isNaN(vol) || vol <= 0) return alert("Cantidad inválida");

      try {
          await batchService.discardVolume({
              batchId,
              volumeDiscarded: vol,
              reason: 'OTHER',
              discardedBy: 'Usuario Actual' // In real app get from auth
          });
          loadInventory();
          alert("Descarte registrado.");
      } catch(e: any) {
          alert("Error: " + e.message);
      }
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Inventario de Leche Humana</h1>
          <p className="mt-2 text-base text-slate-600">Lotes aprobados disponibles para administración.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/administration">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Syringe className="h-5 w-5 mr-2" />
              Nueva Administración
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-teal-50 flex justify-between items-center">
            <h3 className="text-base font-bold text-teal-900">Leche Pasteurizada Aprobada</h3>
            <span className="text-sm text-teal-700 font-medium">Ordenado por fecha (PEPS)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lote
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Fecha Procesamiento
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Volumen Original
                </th>
                 <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Disponible
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
                    Cargando inventario...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mb-2" />
                        <p className="font-medium text-lg text-slate-700">No hay lotes aprobados disponibles.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <Link to={`/batches/${batch.id}`} className="text-base font-bold text-teal-700 hover:text-teal-900 hover:underline">
                        {batch.batchNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {new Date(batch.creationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-700">
                      {batch.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-700">
                      {batch.totalVolume} ml
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold ${
                            batch.currentVolume < 50 ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
                        }`}>
                            {batch.currentVolume} ml
                        </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-3">
                      <Button 
                        variant="secondary" 
                        className="text-sm px-3 py-1"
                        onClick={() => navigate('/administration', { state: { batchId: batch.id } })}
                      >
                         Administrar
                      </Button>
                      <button 
                        onClick={() => handleDiscard(batch.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                        title="Descartar volumen"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};