
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, FlaskConical } from 'lucide-react';
import { batchService } from '../services/batchService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';

export const BatchList: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    const results = batches.filter(batch => 
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBatches(results);
  }, [searchTerm, batches]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await batchService.getAll();
      const sorted = data.sort((a, b) => 
        new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
      );
      setBatches(sorted);
      setFilteredBatches(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      IN_PROCESS: 'bg-blue-100 text-blue-900 border border-blue-200',
      COMPLETED: 'bg-green-100 text-green-900 border border-green-200',
      CANCELLED: 'bg-red-100 text-red-900 border border-red-200',
      PASTEURIZED: 'bg-purple-100 text-purple-900 border border-purple-200',
      APPROVED: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
      REJECTED: 'bg-orange-100 text-orange-900 border border-orange-200',
    };
    
    const labels: Record<string, string> = {
      IN_PROCESS: 'En Proceso',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
      PASTEURIZED: 'Pasteurizado',
      APPROVED: 'Aprobado',
      REJECTED: 'Rechazado'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${styles[status] || styles.IN_PROCESS}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Control de Lotes</h1>
          <p className="mt-2 text-base text-slate-600">Gestión de lotes de leche y asignación de frascos.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/batches/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Lote
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="relative rounded-lg shadow-sm max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 py-3 text-base border-[#C6C6C6] rounded-md bg-[#F2F4F7] placeholder-[#9A9A9A] text-[#333333]"
              placeholder="Buscar por número de lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Lote ID
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Tipo
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Volumen
                </th>
                 <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Frascos
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Cargando lotes...
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron lotes registrados.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <FlaskConical className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-bold text-slate-900">
                            {batch.batchNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <StatusBadge status={batch.status} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-600">
                      {batch.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-base font-bold text-slate-900">
                      {batch.totalVolume} ml
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                      {batch.bottleCount}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600">
                      {new Date(batch.creationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/batches/${batch.id}`} className="text-primary-600 hover:text-primary-800 font-bold flex items-center justify-end gap-1">
                        <Eye className="h-5 w-5" /> Ver
                      </Link>
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
