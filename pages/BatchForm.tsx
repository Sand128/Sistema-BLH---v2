import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Milk } from 'lucide-react';
import { batchService } from '../services/batchService';
import { Bottle } from '../types';
import { Button } from '../components/ui/Button';

export const BatchForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'HOMOLOGOUS' | 'HETEROLOGOUS'>('HETEROLOGOUS');
  const [availableBottles, setAvailableBottles] = useState<Bottle[]>([]);
  const [selectedBottles, setSelectedBottles] = useState<Set<string>>(new Set());
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
    setError(null); // Clear errors on selection change
  };

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Crear Nuevo Lote</h1>
          <p className="text-base text-slate-600 mt-1">Seleccione el tipo de donación y asigne los frascos disponibles.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-base text-red-800 font-bold">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Batch Settings */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
             <div>
              <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Tipo de Donación</label>
              <div className="flex gap-6">
                <label className={`flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all ${type === 'HETEROLOGOUS' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="HETEROLOGOUS" 
                    checked={type === 'HETEROLOGOUS'} 
                    onChange={() => { setType('HETEROLOGOUS'); setError(null); }} 
                    className="sr-only"
                  />
                  <div className="font-bold text-lg text-slate-900 mb-1">Heteróloga</div>
                  <div className="text-sm text-slate-600 font-medium">Mezcla de múltiples donadoras</div>
                </label>
                <label className={`flex-1 border-2 rounded-xl p-5 cursor-pointer transition-all ${type === 'HOMOLOGOUS' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-300 hover:border-slate-400'}`}>
                  <input 
                    type="radio" 
                    name="type" 
                    value="HOMOLOGOUS" 
                    checked={type === 'HOMOLOGOUS'} 
                    onChange={() => { setType('HOMOLOGOUS'); setError(null); }} 
                    className="sr-only"
                  />
                  <div className="font-bold text-lg text-slate-900 mb-1">Homóloga</div>
                  <div className="text-sm text-slate-600 font-medium">Donadora única (Madre-Hijo)</div>
                </label>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 flex flex-col justify-center border border-slate-200">
              <span className="text-sm font-bold text-slate-500 uppercase">Resumen de Selección</span>
              <div className="flex justify-between items-end mt-4">
                <div>
                  <div className="text-4xl font-extrabold text-primary-600">{selectedBottles.size}</div>
                  <div className="text-sm font-medium text-slate-600">Frascos seleccionados</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-slate-900">{selectedVolume} ml</div>
                  <div className="text-sm font-medium text-slate-600">Volumen total estimado</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottle Selection */}
          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-4 border-b border-slate-200 pb-3">Frascos Disponibles</h3>
            {availableBottles.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <Milk className="mx-auto h-16 w-16 text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No hay frascos disponibles</h3>
                <p className="mt-2 text-base text-slate-500">Registre recolecciones en el módulo de donadoras primero.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <ul className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                  {availableBottles.map((bottle) => (
                    <li 
                      key={bottle.id} 
                      className={`p-5 hover:bg-blue-50 cursor-pointer transition-colors ${selectedBottles.has(bottle.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => handleToggleBottle(bottle.id)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            className="h-6 w-6 text-primary-600 focus:ring-primary-500 border-slate-300 rounded cursor-pointer"
                            checked={selectedBottles.has(bottle.id)}
                            readOnly
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-slate-900">{bottle.donorName}</span>
                            <span className="text-lg font-extrabold text-slate-800">{bottle.volume} ml</span>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-sm font-medium text-slate-500">ID: {bottle.id}</span>
                            <span className="text-sm font-medium text-slate-500">{bottle.collectionDate}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate('/batches')} className="w-32">
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading} disabled={selectedBottles.size === 0} className="w-48 shadow-lg shadow-primary-200">
            <Save className="h-5 w-5 mr-2" />
            Crear Lote
          </Button>
        </div>
      </form>
    </div>
  );
};