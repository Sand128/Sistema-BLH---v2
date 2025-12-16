
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, AlertTriangle, Eye, CheckCircle, XCircle } from 'lucide-react';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const REJECTION_REASONS = [
    'Envase dañado o con fisuras',
    'Tapa defectuosa o mal cerrada',
    'Etiqueta incorrecta o ilegible',
    'Congelación inadecuada / Signos de descongelación',
    'Contaminación visible (suciedad, cabellos, etc.)',
    'Volumen insuficiente para análisis',
    'Datos de donadora incompletos'
];

export const PhysicalInspectionForm: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    containerLid: true,
    containerIntegrity: true,
    containerSeal: true,
    containerLabel: true,
    milkState: 'FROZEN', // 'FROZEN' | 'REFRIGERATED' | 'THAWED'
    volumeCheck: '',
    observations: '',
    selectedRejectionReasons: [] as string[]
  });

  useEffect(() => {
    if (batchId) {
      batchService.getById(batchId).then(data => {
        setBatch(data || null);
        if (data) setFormData(prev => ({ ...prev, volumeCheck: data.totalVolume.toString() }));
        setLoading(false);
      });
    }
  }, [batchId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleRejectionReasonToggle = (reason: string) => {
    setFormData(prev => {
        const current = prev.selectedRejectionReasons;
        if (current.includes(reason)) {
            return { ...prev, selectedRejectionReasons: current.filter(r => r !== reason) };
        } else {
            return { ...prev, selectedRejectionReasons: [...current, reason] };
        }
    });
  };

  // Determine verdict based on state
  const isApproved = 
      formData.containerLid && 
      formData.containerIntegrity && 
      formData.containerSeal && 
      formData.containerLabel &&
      formData.selectedRejectionReasons.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !user) return;

    // Validation logic if Rejected but no reason
    if (!isApproved && formData.selectedRejectionReasons.length === 0) {
        alert("Si la inspección es RECHAZADA, debe seleccionar al menos un motivo.");
        return;
    }

    setSaving(true);
    try {
      await batchService.addPhysicalInspection({
        batchId,
        inspectorName: user.name,
        containerState: {
            lid: formData.containerLid,
            integrity: formData.containerIntegrity,
            seal: formData.containerSeal,
            label: formData.containerLabel
        },
        milkState: formData.milkState as any,
        volumeCheck: Number(formData.volumeCheck),
        observations: formData.observations,
        verdict: isApproved ? 'APPROVED' : 'REJECTED',
        rejectionReasons: formData.selectedRejectionReasons
      });
      navigate('/quality-control');
    } catch (error) {
      console.error(error);
      alert('Error al guardar inspección física');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Cargando...</div>;
  if (!batch) return <div className="p-12 text-center text-red-600 font-bold">Lote no encontrado</div>;

  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";
  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Registro de Inspección Física</h1>
          <p className="text-base text-slate-600 mt-1">Lote: <span className="font-bold">{batch.batchNumber}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          
          {/* Header Data */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                   <span className="text-xs font-bold text-slate-500 uppercase">Donación</span>
                   <p className="font-bold text-slate-900">{batch.type === 'HOMOLOGOUS' ? 'Homóloga' : 'Heteróloga'}</p>
               </div>
               <div>
                   <span className="text-xs font-bold text-slate-500 uppercase">Volumen Registrado</span>
                   <p className="font-bold text-slate-900">{batch.totalVolume} ml</p>
               </div>
          </div>

          {/* Container State */}
          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-slate-500" />
                Estado del Envase
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-colors">
                        <span className="font-bold text-slate-700">Tapa Correcta</span>
                        <input 
                            type="checkbox" 
                            checked={formData.containerLid}
                            onChange={(e) => handleCheckboxChange('containerLid', e.target.checked)}
                            className="h-6 w-6 text-green-600 focus:ring-green-500 rounded border-gray-300"
                        />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-colors">
                        <span className="font-bold text-slate-700">Integridad (Sin roturas)</span>
                        <input 
                            type="checkbox" 
                            checked={formData.containerIntegrity}
                            onChange={(e) => handleCheckboxChange('containerIntegrity', e.target.checked)}
                            className="h-6 w-6 text-green-600 focus:ring-green-500 rounded border-gray-300"
                        />
                    </label>
                </div>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-colors">
                        <span className="font-bold text-slate-700">Sello Intacto</span>
                        <input 
                            type="checkbox" 
                            checked={formData.containerSeal}
                            onChange={(e) => handleCheckboxChange('containerSeal', e.target.checked)}
                            className="h-6 w-6 text-green-600 focus:ring-green-500 rounded border-gray-300"
                        />
                    </label>
                    <label className="flex items-center justify-between p-4 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer hover:bg-white transition-colors">
                        <span className="font-bold text-slate-700">Etiqueta Legible</span>
                        <input 
                            type="checkbox" 
                            checked={formData.containerLabel}
                            onChange={(e) => handleCheckboxChange('containerLabel', e.target.checked)}
                            className="h-6 w-6 text-green-600 focus:ring-green-500 rounded border-gray-300"
                        />
                    </label>
                </div>
            </div>
            {(!formData.containerLid || !formData.containerIntegrity || !formData.containerSeal || !formData.containerLabel) && (
                <p className="mt-3 text-sm text-red-600 font-bold flex items-center bg-red-50 p-2 rounded">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Cualquier defecto en el envase causa rechazo automático.
                </p>
            )}
          </div>

          {/* Milk State & Volume */}
          <div>
             <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3">Estado de la Muestra</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className={labelClass}>Estado Térmico al Recibir</label>
                    <select
                        name="milkState"
                        className={selectClass}
                        value={formData.milkState}
                        onChange={handleChange}
                    >
                        <option value="FROZEN">Congelada</option>
                        <option value="REFRIGERATED">Refrigerada</option>
                        <option value="THAWED">Descongelada (Rechazo)</option>
                    </select>
                </div>
                <div>
                     <Input 
                        label="Volumen Verificado (ml)"
                        name="volumeCheck"
                        type="number"
                        value={formData.volumeCheck}
                        onChange={handleChange}
                        required
                    />
                </div>
             </div>
          </div>

          {/* Rejection Reasons (Conditional or Manual) */}
          <div>
              <h3 className="text-xl font-bold leading-6 text-slate-900 mb-4 border-b border-slate-200 pb-3">Motivos de Rechazo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {REJECTION_REASONS.map(reason => (
                      <label key={reason} className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${formData.selectedRejectionReasons.includes(reason) ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                          <input 
                            type="checkbox"
                            className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            checked={formData.selectedRejectionReasons.includes(reason)}
                            onChange={() => handleRejectionReasonToggle(reason)}
                          />
                          <span className={`text-sm font-medium ${formData.selectedRejectionReasons.includes(reason) ? 'text-red-900' : 'text-slate-700'}`}>
                              {reason}
                          </span>
                      </label>
                  ))}
              </div>
          </div>
          
          <div>
              <label htmlFor="observations" className={labelClass}>
                Observaciones Generales
              </label>
              <textarea
                id="observations"
                name="observations"
                rows={3}
                className="block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]"
                value={formData.observations}
                onChange={handleChange}
                placeholder="Notas adicionales..."
              />
          </div>

          {/* Verdict Preview */}
          <div className={`rounded-xl p-6 border-2 ${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-4">
                  {isApproved ? <CheckCircle className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
                  <div>
                      <h3 className={`text-xl font-extrabold ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
                          Resultado: {isApproved ? 'APROBADO' : 'RECHAZADO'}
                      </h3>
                      <p className={`text-sm font-medium mt-1 ${isApproved ? 'text-green-700' : 'text-red-700'}`}>
                          {isApproved 
                            ? 'El lote cumple con la inspección física. Se habilitará el análisis fisicoquímico.' 
                            : 'El lote será marcado como RECHAZADO inmediatamente.'}
                      </p>
                  </div>
              </div>
          </div>

        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate('/quality-control')} className="w-32">
            Cancelar
          </Button>
          <Button type="submit" isLoading={saving} className="w-64 shadow-lg">
            <Save className="h-5 w-5 mr-2" />
            Guardar Inspección
          </Button>
        </div>
      </form>
    </div>
  );
};
