
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, Milk, Search, ArrowUpDown, 
  Clock, User, Droplets, Hash, Calendar, CheckSquare, Square,
  AlertTriangle
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { Bottle } from '../types';
import { Button } from '../components/ui/Button';

type SortKey = keyof Bottle;

export const BatchForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'HOMOLOGOUS' | 'HETEROLOGOUS'>('HETEROLOGOUS');
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [selectedBottles, setSelectedBottles] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBottles = async () => {
      try {
        const bottles = await batchService.getAvailableBottles();
        setAvailableBottles(bottles);
      } catch (error) {
        console.error(error);
      }
    };
    fetchBottles();
  }, []);

  const handleToggleBottle = (id: string) => {
    const next = new Set(selectedBottles);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedBottles(next);
    setError(null);
  };

  const handleSelectAll = (filteredIds: string[]) => {
    const allSelected = filteredIds.every(id => selectedBottles.has(id));
    const next = new Set(selectedBottles);
    if (allSelected) {
      filteredIds.forEach(id => next.delete(id));
    } else {
      filteredIds.forEach(id => next.add(id));
    }
    setSelectedBottles(next);
  };

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedBottles = useMemo(() => {
    let result = [...availableBottles];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.traceabilityCode.toLowerCase().includes(lowerSearch) ||
        b.donorName.toLowerCase().includes(lowerSearch) ||
        b.milkType.toLowerCase().includes(lowerSearch) ||
        b.hospitalInitials.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a: any, b: any) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [availableBottles, searchTerm, sortConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBottles.size === 0) {
      alert("Debe seleccionar al menos un frasco para crear el lote.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await batchService.create({
        type,
        selectedBottleIds: Array.from(selectedBottles)
      });
      navigate('/batches');
    } catch (error: any) {
      console.error(error);
      setError(error.message || 'Error al crear lote');
    } finally {
      setLoading(false);
    }
  };

  const selectedVolume = availableBottles
    .filter(b => selectedBottles.has(b.id))
    .reduce((sum, b) => sum + b.volume, 0);

  const SortButton = ({ k, label }: { k: SortKey, label: string }) => (
    <button 
      type="button" 
      onClick={() => requestSort(k)}
      className={`flex items-center gap-1 hover:text-primary-600 transition-colors uppercase tracking-wider text-[10px] font-black ${sortConfig?.key === k ? 'text-primary-600' : 'text-slate-500'}`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Conformación de Lote</h1>
          <p className="text-base text-slate-600 mt-1">Gestión de trazabilidad: Selección de frascos para pasteurización.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white shadow-md rounded-2xl p-8 border border-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                   <Milk className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Parámetros del Lote</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Tipo de Lote</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center text-center ${type === 'HETEROLOGOUS' ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="type" 
                        value="HETEROLOGOUS" 
                        checked={type === 'HETEROLOGOUS'} 
                        onChange={() => { setType('HETEROLOGOUS'); setError(null); }} 
                        className="sr-only"
                      />
                      <span className="font-black text-slate-900 text-sm mb-1 uppercase">Heterólogo</span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">Múltiples Donadoras</span>
                    </label>
                    <label className={`flex-1 border-2 rounded-2xl p-4 cursor-pointer transition-all flex flex-col items-center text-center ${type === 'HOMOLOGOUS' ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                      <input 
                        type="radio" 
                        name="type" 
                        value="HOMOLOGOUS" 
                        checked={type === 'HOMOLOGOUS'} 
                        onChange={() => { setType('HOMOLOGOUS'); setError(null); }} 
                        className="sr-only"
                      />
                      <span className="font-black text-slate-900 text-sm mb-1 uppercase">Homólogo</span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">Donadora Única</span>
                    </label>
                  </div>
                  {type === 'HOMOLOGOUS' && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                       {/* Fix: AlertTriangle is now imported */}
                       <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                       <p className="text-[10px] text-amber-800 font-bold leading-normal uppercase">
                         Restricción: Todos los frascos seleccionados deben pertenecer a la misma donadora.
                       </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Save className="h-20 w-20" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Métricas del Lote</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end border-b border-white/10 pb-2">
                         <span className="text-xs font-bold text-slate-400 uppercase">Frascos</span>
                         <span className="text-2xl font-black text-primary-400">{selectedBottles.size}</span>
                      </div>
                      <div className="flex justify-between items-end">
                         <span className="text-xs font-bold text-slate-400 uppercase">Volumen Total</span>
                         <span className="text-2xl font-black text-white">{selectedVolume} <span className="text-sm font-medium">mL</span></span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white shadow-md rounded-2xl p-8 border border-slate-200">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                   <Search className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Filtros de Búsqueda</h3>
             </div>
             <div className="space-y-4">
                <div className="relative">
                   <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder="Buscar por Folio, Donadora o Tipo..."
                      className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-slate-50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                   <p className="text-[10px] text-blue-800 font-bold uppercase leading-tight">
                     Sugerencia: Utilice el folio (HO/HE) para una identificación rápida de muestras físicas.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-center gap-3 animate-in shake">
            {/* Fix: AlertTriangle is now imported */}
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <p className="text-sm text-red-800 font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        {/* Bottles Selection Table */}
        <div className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary-500" />
                Frascos Disponibles para Selección
             </h3>
             <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase">{filteredAndSortedBottles.length} frascos en lista</span>
                <button 
                  type="button"
                  onClick={() => handleSelectAll(filteredAndSortedBottles.map(b => b.id))}
                  className="text-xs font-black text-primary-600 hover:text-primary-700 uppercase"
                >
                  {filteredAndSortedBottles.every(b => selectedBottles.has(b.id)) ? 'Deseleccionar todos' : 'Seleccionar filtrados'}
                </button>
             </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 w-12"></th>
                  <th className="px-6 py-4 min-w-[140px]">
                    <SortButton k="traceabilityCode" label="Folio del Frasco" />
                  </th>
                  <th className="px-6 py-4 min-w-[180px]">
                    <SortButton k="collectionDateTime" label="Extracción (Fecha/Hora)" />
                  </th>
                  <th className="px-6 py-4">
                    <SortButton k="volume" label="Volumen (mL)" />
                  </th>
                  <th className="px-6 py-4">
                    <SortButton k="milkType" label="Tipo de Leche" />
                  </th>
                  <th className="px-6 py-4">
                    <SortButton k="donorName" label="Donadora (Nombre/ID)" />
                  </th>
                  <th className="px-6 py-4">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Unidad</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedBottles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-20 text-center">
                       <Milk className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No se encontraron frascos disponibles</p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedBottles.map((bottle) => {
                    const isSelected = selectedBottles.has(bottle.id);
                    return (
                      <tr 
                        key={bottle.id} 
                        className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${isSelected ? 'bg-primary-50/30' : ''}`}
                        onClick={() => handleToggleBottle(bottle.id)}
                      >
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                            onClick={() => handleToggleBottle(bottle.id)}
                            className={`transition-colors p-1 rounded-md ${isSelected ? 'text-primary-600' : 'text-slate-300 hover:text-slate-400'}`}
                          >
                            {isSelected ? <CheckSquare className="h-6 w-6" /> : <Square className="h-6 w-6" />}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                             {bottle.traceabilityCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                               <Calendar className="h-3 w-3 text-slate-400" />
                               {bottle.collectionDate}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                               <Clock className="h-3 w-3 text-slate-400" />
                               {bottle.collectionDateTime ? new Date(bottle.collectionDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-sm font-black text-slate-900">{bottle.volume} <span className="text-[10px] text-slate-400 uppercase">mL</span></span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`text-[10px] font-black px-2 py-1 rounded-full border uppercase ${
                             bottle.milkType === 'CALOSTRO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                             bottle.milkType === 'TRANSICION' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                             'bg-emerald-50 text-emerald-700 border-emerald-200'
                           }`}>
                             <Droplets className="h-2 w-2 inline-block mr-1 mb-0.5" />
                             {bottle.milkType}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-white shadow-sm">
                                {bottle.donorName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900 truncate max-w-[150px]">{bottle.donorName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">ID: {bottle.donorId}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                             {bottle.hospitalInitials}
                           </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
          <Button type="button" variant="outline" onClick={() => navigate('/batches')} className="w-40 h-14">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={loading} 
            disabled={selectedBottles.size === 0} 
            className="w-72 h-14 bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-200 text-lg"
          >
            <Save className="h-6 w-6 mr-3" />
            Confirmar y Crear Lote
          </Button>
        </div>
      </form>
    </div>
  );
};
