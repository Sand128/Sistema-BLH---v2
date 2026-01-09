
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, AlertTriangle, Eye, CheckCircle, XCircle, Droplets } from 'lucide-react';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { Batch, Bottle } from '../types';
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
  const { batchId, bottleId } = useParams<{ batchId: string, bottleId: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    containerLid: true,
    containerIntegrity: true,
    containerSeal: true,
    containerLabel: true,
    milkState: 'FROZEN',
    volumeCheck: '',
    observations: '',
    selectedRejectionReasons: [] as string[]
  });

  useEffect(() => {
    if (batchId && bottleId) {
      Promise.all([
          batchService.getById(batchId),
          batchService.getBottleById(bottleId)
      ]).then(([bData, botData]) => {
        setBatch(bData || null);
        setBottle(botData || null);
        if (botData) setFormData(prev => ({ ...prev, volumeCheck: botData.volume.toString() }));
        setLoading(false);
      });
    }
  }, [batchId, bottleId]);

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

  const isApproved = 
      formData.containerLid && 
      formData.containerIntegrity && 
      formData.containerSeal && 
      formData.containerLabel &&
      formData.selectedRejectionReasons.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !bottleId || !user) return;

    if (!isApproved && formData.selectedRejectionReasons.length === 0) {
        alert("Si la inspección es RECHAZADA, debe seleccionar al menos un motivo.");
        return;
    }

    setSaving(true);
    try {
      await batchService.addBottlePhysicalInspection({
        batchId,
        bottleId,
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
      navigate(`/quality-control/batch/${batchId}`);
    } catch (error) {
      console.error(error);
      alert('Error al guardar inspección física');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Cargando...</div>;
  if (!batch || !bottle) return <div className="p-12 text-center text-red-600 font-bold">Registro no encontrado</div>;

  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";
  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 uppercase">Inspección Física de Frasco</h1>
          <p className="text-base text-slate-600 mt-1">Lote: <span className="font-bold">{batch.batchNumber}</span> • Frasco: <span className="font-bold text-primary-600">{bottle.traceabilityCode}</span></p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
               <div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donadora</span>
                   <p className="text-lg font-black text-slate-900">{bottle.donorName}</p>
               </div>
               <div className="flex gap-8">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Leche</span>
                        <p className="font-bold text-slate-900 flex items-center gap-2"><Droplets className="h-4 w-4 text-pink-500" />{bottle.milkType}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen Recolectado</span>
                        <p className="font-bold text-slate-900">{bottle.volume} ml</p>
                    </div>
               </div>
          </div>

          <div>
            <h3 className="text-xl font-bold leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3 flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary-500" />
                Estado del Envase Individual
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-slate-50 cursor-pointer hover:bg-white transition-all">
                    <span className="font-bold text-slate-700">Tapa Correcta</span>
                    <input type="checkbox" checked={formData.containerLid} onChange={(e) => handleCheckboxChange('containerLid', e.target.checked)} className="h-6 w-6 text-green-600 rounded border-slate-300" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-slate-50 cursor-pointer hover:bg-white transition-all">
                    <span className="font-bold text-slate-700">Integridad</span>
                    <input type="checkbox" checked={formData.containerIntegrity} onChange={(e) => handleCheckboxChange('containerIntegrity', e.target.checked)} className="h-6 w-6 text-green-600 rounded border-slate-300" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-slate-50 cursor-pointer hover:bg-white transition-all">
                    <span className="font-bold text-slate-700">Sello Intacto</span>
                    <input type="checkbox" checked={formData.containerSeal} onChange={(e) => handleCheckboxChange('containerSeal', e.target.checked)} className="h-6 w-6 text-green-600 rounded border-slate-300" />
                </label>
                <label className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-100 bg-slate-50 cursor-pointer hover:bg-white transition-all">
                    <span className="font-bold text-slate-700">Etiqueta Legible</span>
                    <input type="checkbox" checked={formData.containerLabel} onChange={(e) => handleCheckboxChange('containerLabel', e.target.checked)} className="h-6 w-6 text-green-600 rounded border-slate-300" />
                </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className={labelClass}>Estado Térmico</label>
                  <select name="milkState" className={selectClass} value={formData.milkState} onChange={handleChange}>
                      <option value="FROZEN">Congelada</option>
                      <option value="REFRIGERATED">Refrigerada</option>
                      <option value="THAWED">Descongelada (Rechazo)</option>
                  </select>
              </div>
              <Input label="Volumen Verificado (ml)" name="volumeCheck" type="number" value={formData.volumeCheck} onChange={handleChange} required />
          </div>

          <div>
              <h3 className="text-sm font-black text-slate-500 uppercase mb-4 tracking-widest">Motivos específicos de rechazo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {REJECTION_REASONS.map(reason => (
                      <label key={reason} className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.selectedRejectionReasons.includes(reason) ? 'bg-red-50 border-red-300' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                          <input type="checkbox" className="mt-1 h-4 w-4 text-red-600 rounded border-slate-300" checked={formData.selectedRejectionReasons.includes(reason)} onChange={() => handleRejectionReasonToggle(reason)} />
                          <span className={`text-xs font-bold ${formData.selectedRejectionReasons.includes(reason) ? 'text-red-900' : 'text-slate-600'}`}>{reason}</span>
                      </label>
                  ))}
              </div>
          </div>
          
          <div>
              <label className={labelClass}>Observaciones del Frasco</label>
              <textarea name="observations" rows={2} className={selectClass} value={formData.observations} onChange={handleChange} placeholder="Detallar cualquier anomalía física..." />
          </div>

          <div className={`rounded-2xl p-6 border-4 ${isApproved ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} animate-in zoom-in-95`}>
              <div className="flex items-center gap-4">
                  {isApproved ? <CheckCircle className="h-10 w-10 text-emerald-600" /> : <XCircle className="h-10 w-10 text-red-600" />}
                  <div>
                      <h3 className={`text-xl font-black ${isApproved ? 'text-emerald-800' : 'text-red-800'}`}>DICTAMEN: {isApproved ? 'APROBADO' : 'NO APTO'}</h3>
                      <p className="text-sm font-medium opacity-80">{isApproved ? 'Frasco listo para análisis químico.' : 'Este frasco será excluido del proceso de pasteurización.'}</p>
                  </div>
              </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-32">Cancelar</Button>
          <Button type="submit" isLoading={saving} className={`w-64 h-14 text-lg font-black shadow-xl ${isApproved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
            <Save className="h-5 w-5 mr-2" /> Guardar Registro
          </Button>
        </div>
      </form>
    </div>
  );
};
