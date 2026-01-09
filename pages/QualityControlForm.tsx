
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const QualityControlForm: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    acidityDornic: '',
    crematocrit: '',
    flavor: 'NORMAL',
    color: '',
    packagingState: 'OK',
    coliformsPresence: 'false', // String for select
    notes: ''
  });

  useEffect(() => {
    if (batchId) {
      batchService.getById(batchId).then(data => {
        setBatch(data || null);
        setLoading(false);
      });
    }
  }, [batchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateVerdict = () => {
    const acidity = Number(formData.acidityDornic);
    const hasColiforms = formData.coliformsPresence === 'true';

    if (acidity > 8 || hasColiforms) {
      return { status: 'REJECTED', label: 'RECHAZADO', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    }
    return { status: 'APPROVED', label: 'APROBADO', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !user) return;

    setSaving(true);
    try {
      await batchService.addQualityControl({
        batchId,
        inspectorName: user.name,
        acidityDornic: Number(formData.acidityDornic),
        crematocrit: Number(formData.crematocrit),
        flavor: formData.flavor as 'NORMAL' | 'OFF_FLAVOR',
        color: formData.color,
        packagingState: formData.packagingState as 'OK' | 'DAMAGED',
        coliformsPresence: formData.coliformsPresence === 'true',
        notes: formData.notes
      });
      navigate(`/batches/${batchId}`);
    } catch (error) {
      console.error(error);
      alert('Error al guardar análisis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Cargando...</div>;
  if (!batch) return <div className="p-12 text-center text-red-600 font-bold">Lote no encontrado</div>;

  const verdict = calculateVerdict();
  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Registro de Control de Calidad</h1>
          <p className="text-base text-slate-600 mt-1">Lote: <span className="font-bold">{batch.batchNumber}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          
          {/* Physicochemical Analysis */}
          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3">Análisis Fisicoquímico</h3>
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2">
                <div>
                    <Input
                        label="Acidez Dornic (°D)"
                        name="acidityDornic"
                        type="number"
                        min="1"
                        max="20"
                        step="0.1"
                        required
                        value={formData.acidityDornic}
                        onChange={handleChange}
                    />
                    {Number(formData.acidityDornic) > 8 && (
                        <p className="text-sm text-red-700 mt-2 font-bold flex items-center bg-red-50 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 mr-2" /> Acidez mayor 8°D (Rechazo)
                        </p>
                    )}
                    {Number(formData.acidityDornic) > 0 && Number(formData.acidityDornic) <= 8 && (
                        <p className="text-sm text-green-700 mt-2 font-bold flex items-center bg-green-50 p-2 rounded">
                            <CheckCircle className="h-4 w-4 mr-2" /> Acidez Aceptable
                        </p>
                    )}
                </div>

                <div>
                    <Input
                        label="Crematocrito (Kcal/L)"
                        name="crematocrit"
                        type="number"
                        min="0"
                        required
                        value={formData.crematocrit}
                        onChange={handleChange}
                    />
                    <p className="text-sm text-slate-500 mt-2 font-medium">Óptimo: &gt; 650 Kcal/L</p>
                </div>
            </div>
          </div>

          {/* Sensory Analysis */}
          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3">Características Organolépticas</h3>
            <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2">
                 <div>
                    <Input 
                        label="Color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Blanco, Amarillento..."
                    />
                </div>
                <div>
                    <label className={labelClass}>Olor / Flavor</label>
                    <select
                        name="flavor"
                        className={selectClass}
                        value={formData.flavor}
                        onChange={handleChange}
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="OFF_FLAVOR">Off-Flavor (Rancio, Agrio)</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Estado del Embalaje</label>
                    <select
                        name="packagingState"
                        className={selectClass}
                        value={formData.packagingState}
                        onChange={handleChange}
                    >
                        <option value="OK">Íntegro</option>
                        <option value="DAMAGED">Dañado / Sucio</option>
                    </select>
                </div>
            </div>
          </div>

          {/* Microbiological Analysis */}
          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3">Análisis Microbiológico</h3>
             <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2">
                <div>
                    <label className={labelClass}>Presencia de Coliformes</label>
                    <select
                        name="coliformsPresence"
                        className={selectClass}
                        value={formData.coliformsPresence}
                        onChange={handleChange}
                    >
                        <option value="false">Negativo (Ausencia)</option>
                        <option value="true">Positivo (Presencia)</option>
                    </select>
                     {formData.coliformsPresence === 'true' && (
                        <p className="text-sm text-red-700 mt-2 font-bold flex items-center bg-red-50 p-2 rounded">
                            <AlertTriangle className="h-4 w-4 mr-2" /> Rechazo Automático
                        </p>
                    )}
                </div>
             </div>
          </div>
          
          <div className="sm:col-span-2">
              <label htmlFor="notes" className={labelClass}>
                Observaciones Adicionales
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                className="block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Notas adicionales..."
              />
          </div>

          {/* Dynamic Verdict Preview */}
          <div className={`rounded-xl p-6 ${verdict.bg} border-2`}>
              <div className="flex">
                  <div className="flex-shrink-0">
                      {verdict.status === 'APPROVED' ? 
                        <CheckCircle className={`h-8 w-8 ${verdict.color}`} /> : 
                        <XCircle className={`h-8 w-8 ${verdict.color}`} />
                      }
                  </div>
                  <div className="ml-4">
                      <h3 className={`text-xl font-extrabold ${verdict.color}`}>
                          Resultado Preliminar: {verdict.label}
                      </h3>
                      <div className={`mt-2 text-base font-medium ${verdict.color}`}>
                          <p>
                              {verdict.status === 'APPROVED' 
                                ? 'El lote cumple con los criterios de calidad para ser liberado.' 
                                : 'El lote será marcado como RECHAZADO y deberá ser descartado.'}
                          </p>
                      </div>
                  </div>
              </div>
          </div>

        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate('/quality-control')} className="w-32">
            Cancelar
          </Button>
          <Button type="submit" isLoading={saving} className="w-48 shadow-lg">
            <Save className="h-5 w-5 mr-2" />
            Guardar Resultados
          </Button>
        </div>
      </form>
    </div>
  );
};
