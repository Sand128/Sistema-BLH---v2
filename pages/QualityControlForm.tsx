
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, AlertTriangle, CheckCircle, XCircle, 
  Info, Eye, ShieldAlert, HeartPulse, Stethoscope, Zap, Droplets
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { Batch, Bottle } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  status: 'APTO' | 'NO_APTO';
  description: string;
  risk?: string;
  canBeHomologous?: boolean;
}

const COLOR_OPTIONS: ColorOption[] = [
  { id: 'C1', name: 'Blanco', hex: '#FFFFFF', status: 'APTO', description: 'Dispersión de luz por glóbulos de grasa y caseína.' },
  { id: 'C2', name: 'Blanquecino / Opaco', hex: '#F9F9F4', status: 'APTO', description: 'Fase intermedia; alta concentración de caseína.' },
  { id: 'C3', name: 'Amarillento / Intenso', hex: '#FFF59D', status: 'APTO', description: 'Presencia de carotenos (etapa final de extracción).' },
  { id: 'C4', name: 'Azulado', hex: '#E3F2FD', status: 'APTO', description: 'Predominio de fracción hidrosoluble (inicio).' },
  { id: 'C5', name: 'Verdoso', hex: '#E8F5E9', status: 'APTO', description: 'Asociado a dieta materna (vegetales o algas).' },
  { id: 'C6', name: 'Agua de coco', hex: '#F0F4F8', status: 'APTO', description: 'Predominio hidrosoluble al inicio de extracción.' },
  { id: 'D1', name: 'Rojo-ladrillo', hex: '#B22222', status: 'NO_APTO', canBeHomologous: true, description: 'Presencia de sangre.', risk: 'Descarga papilar o fisuras en el pezón.' },
  { id: 'D2', name: 'Marrón oscuro', hex: '#5D4037', status: 'NO_APTO', canBeHomologous: true, description: 'Presencia de sangre o hemoglobina oxidada.', risk: 'Posible hemorragia capilar antigua.' },
  { id: 'D3', name: 'Rojo-naranja', hex: '#FF5722', status: 'NO_APTO', canBeHomologous: false, description: 'Contaminación bacteriana.', risk: 'Presencia de Serratia marcescens.' },
  { id: 'D4', name: 'Verde oscuro', hex: '#1B5E20', status: 'NO_APTO', canBeHomologous: false, description: 'Contaminación bacteriana.', risk: 'Presencia de Pseudomonas spp.' },
  { id: 'D5', name: 'Rosado / Anaranjado', hex: '#F06292', status: 'NO_APTO', canBeHomologous: false, description: 'Medicamentos o colorantes.', risk: 'Uso de fármacos o aditivos artificiales.' },
];

export const QualityControlForm: React.FC = () => {
  const { batchId, bottleId } = useParams<{ batchId: string, bottleId: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [bottle, setBottle] = useState<Bottle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [medicalOverride, setMedicalOverride] = useState(false);

  const [formData, setFormData] = useState({
    acidityDornic: '',
    crematocrit: '',
    flavor: 'NORMAL',
    colorId: '',
    packagingState: 'OK',
    coliformsPresence: 'false',
    notes: ''
  });

  useEffect(() => {
    if (batchId && bottleId) {
      Promise.all([
          batchService.getById(batchId),
          batchService.getBottleById(bottleId)
      ]).then(([bData, botData]) => {
        setBatch(bData || null);
        setBottle(botData || null);
        setLoading(false);
      });
    }
  }, [batchId, bottleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedColor = COLOR_OPTIONS.find(c => c.id === formData.colorId);
  const isHomologousBatch = batch?.type === 'HOMOLOGOUS';

  const getCaloricClassification = (value: string): 'HIPOCALÓRICA' | 'NORMOCALÓRICA' | 'HIPERCALÓRICA' | '' => {
    const num = Number(value);
    if (!value || isNaN(num)) return '';
    if (num < 500) return 'HIPOCALÓRICA';
    if (num <= 700) return 'NORMOCALÓRICA';
    return 'HIPERCALÓRICA';
  };

  const caloricClassification = getCaloricClassification(formData.crematocrit);
  
  const calculateVerdict = () => {
    const acidity = Number(formData.acidityDornic);
    const hasColiforms = formData.coliformsPresence === 'true';
    let colorRejected = false;
    if (selectedColor && selectedColor.status === 'NO_APTO') {
        const canOverride = isHomologousBatch && selectedColor.canBeHomologous && medicalOverride;
        if (!canOverride) colorRejected = true;
    }
    if (acidity > 8 || hasColiforms || colorRejected) {
      return { status: 'REJECTED', label: 'NO APTO', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    }
    return { status: 'APPROVED', label: 'APROBADO', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !bottleId || !user || !selectedColor || !caloricClassification) return;

    setSaving(true);
    try {
      await batchService.addBottleQualityControl({
        batchId,
        bottleId,
        inspectorName: user.name,
        acidityDornic: Number(formData.acidityDornic),
        crematocrit: Number(formData.crematocrit),
        caloricClassification: caloricClassification as any,
        flavor: formData.flavor as 'NORMAL' | 'OFF_FLAVOR',
        color: `${selectedColor.id} - ${selectedColor.name}${medicalOverride ? ' (Validación Médica)' : ''}`,
        packagingState: formData.packagingState as 'OK' | 'DAMAGED',
        coliformsPresence: formData.coliformsPresence === 'true',
        notes: formData.notes + (medicalOverride ? ' [Autorizado por Validación Médica Especial]' : '')
      });
      navigate(`/quality-control/batch/${batchId}`);
    } catch (error) {
      console.error(error);
      alert('Error al guardar análisis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Cargando...</div>;
  if (!batch || !bottle) return <div className="p-12 text-center text-red-600 font-bold">Registro no encontrado</div>;

  const verdict = calculateVerdict();
  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 uppercase">Análisis Fisicoquímico de Frasco</h1>
          <p className="text-base text-slate-600 mt-1">Frasco: <span className="font-black text-primary-600">{bottle.traceabilityCode}</span> • Lote: {batch.batchNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-3xl overflow-hidden border border-slate-200">
        <div className="bg-primary-900 text-white px-8 py-3 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary-300" />
            <p className="text-xs font-black uppercase tracking-[0.1em]">Protocolo ISEM: Evaluación a contraluz y tras deshielo inmediato.</p>
        </div>

        <div className="p-10 space-y-12">
          
          <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200">
               <div className="flex-1">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Donadora Responsable</span>
                   <p className="text-xl font-black text-slate-900 leading-tight">{bottle.donorName}</p>
               </div>
               <div className="flex gap-10">
                   <div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Leche</span>
                       <p className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tighter"><Droplets className="h-4 w-4 text-pink-500" />{bottle.milkType}</p>
                   </div>
                   <div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volumen</span>
                       <p className="font-black text-slate-900">{bottle.volume} ml</p>
                   </div>
               </div>
          </div>

          <section>
            <div className="flex items-center justify-between mb-8 border-b-2 border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <Eye className="h-6 w-6 text-primary-600" /> Evaluación Sensorial: Color
                </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {COLOR_OPTIONS.map((opt) => (
                    <button key={opt.id} type="button" onClick={() => { setFormData(prev => ({ ...prev, colorId: opt.id })); setMedicalOverride(false); }} className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.colorId === opt.id ? (opt.status === 'APTO' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' : 'border-red-500 bg-red-50 shadow-md scale-105') : 'border-slate-100 bg-white hover:border-slate-300'}`}>
                        <div className="h-12 w-12 rounded-full border border-slate-200 shadow-inner" style={{ backgroundColor: opt.hex }} />
                        <span className="text-[10px] font-black text-center leading-none uppercase text-slate-700">{opt.name}</span>
                        {formData.colorId === opt.id && <div className="absolute -top-2 -right-2">{opt.status === 'APTO' ? <CheckCircle className="h-6 w-6 text-emerald-600 fill-white" /> : <XCircle className="h-6 w-6 text-red-600 fill-white" />}</div>}
                    </button>
                ))}
            </div>
            {selectedColor && (
                <div className={`mt-8 p-6 rounded-2xl border-2 flex gap-5 animate-in slide-in-from-top-4 ${selectedColor.status === 'APTO' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="p-3 bg-white rounded-xl shadow-sm">{selectedColor.status === 'APTO' ? <Info className="h-6 w-6 text-emerald-500" /> : <ShieldAlert className="h-6 w-6 text-red-500" />}</div>
                    <div className="flex-1">
                        <h4 className="text-sm font-black uppercase tracking-widest">{selectedColor.name} - {selectedColor.status}</h4>
                        <p className="text-xs text-slate-600 mt-1">{selectedColor.description}</p>
                        {selectedColor.risk && <p className="text-xs font-black text-red-700 mt-1 italic uppercase tracking-tighter">Riesgo: {selectedColor.risk}</p>}
                        {selectedColor.status === 'NO_APTO' && selectedColor.canBeHomologous && isHomologousBatch && (
                            <div className="mt-4 pt-4 border-t border-red-200 flex justify-between items-center">
                                <p className="text-[10px] font-black text-red-800 flex items-center gap-2"><HeartPulse className="h-4 w-4" /> EXCEPCIÓN MÉDICA DISPONIBLE</p>
                                <button type="button" onClick={() => setMedicalOverride(!medicalOverride)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${medicalOverride ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-red-600 border border-red-300'}`}>
                                    {medicalOverride ? 'VALIDACIÓN ACTIVADA' : 'HABILITAR VALIDACIÓN'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
          </section>

          <section>
            <h3 className="text-xl font-black text-slate-900 mb-8 border-b-2 border-slate-100 pb-4">Análisis Químico Individual</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                    <Input label="Acidez Dornic (°D)" name="acidityDornic" type="number" required value={formData.acidityDornic} onChange={handleChange} />
                    {Number(formData.acidityDornic) > 8 && <p className="text-xs text-red-700 font-black uppercase mt-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Rechazo por acidez elevada</p>}
                </div>
                <div>
                    <Input label="Crematocrito (Kcal/L)" name="crematocrit" type="number" required value={formData.crematocrit} onChange={handleChange} />
                    {caloricClassification && (
                        <div className={`mt-2 p-4 rounded-xl border-2 flex items-center gap-4 ${caloricClassification === 'HIPOCALÓRICA' ? 'bg-amber-50 border-amber-200' : caloricClassification === 'NORMOCALÓRICA' ? 'bg-emerald-50 border-emerald-200' : 'bg-indigo-50 border-indigo-200'}`}>
                            <Zap className={`h-6 w-6 ${caloricClassification === 'HIPOCALÓRICA' ? 'text-amber-500' : caloricClassification === 'NORMOCALÓRICA' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dictamen Nutricional</p><p className="text-lg font-black text-slate-900">{caloricClassification}</p></div>
                        </div>
                    )}
                </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div><label className={labelClass}>Olor / Sabor</label><select name="flavor" className={selectClass} value={formData.flavor} onChange={handleChange}><option value="NORMAL">Normal</option><option value="OFF_FLAVOR">Alterado (Rancio/Agrio)</option></select></div>
              <div><label className={labelClass}>Presencia Microbiana (Coliformes)</label><select name="coliformsPresence" className={selectClass} value={formData.coliformsPresence} onChange={handleChange}><option value="false">Negativo (Ausencia)</option><option value="true">Positivo (Presencia)</option></select></div>
          </div>
          
          <div><label className={labelClass}>Observaciones del Análisis</label><textarea name="notes" rows={2} className={selectClass} value={formData.notes} onChange={handleChange} placeholder="Detallar inconsistencias o motivos específicos de no aptitud..." /></div>

          <div className={`rounded-3xl p-8 border-4 ${verdict.bg} animate-in fade-in duration-500`}>
              <div className="flex items-center gap-6">
                  {verdict.status === 'APPROVED' ? <CheckCircle className={`h-12 w-12 ${verdict.color}`} /> : <XCircle className={`h-12 w-12 ${verdict.color}`} />}
                  <div>
                      <h3 className={`text-2xl font-black ${verdict.color}`}>VEREDICTO DE UNIDAD: {verdict.label}</h3>
                      <p className="text-base font-bold opacity-80">{verdict.status === 'APPROVED' ? 'Este frasco cumple con los estándares biológicos para ser pasteurizado.' : 'Este frasco ha sido descartado y no podrá utilizarse en este lote.'}</p>
                  </div>
              </div>
          </div>
        </div>

        <div className="px-10 py-8 bg-slate-50 text-right flex justify-end gap-6 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-40 h-14">Cancelar</Button>
          <Button type="submit" isLoading={saving} disabled={!formData.colorId || !caloricClassification} className={`w-72 h-14 text-xl font-black shadow-2xl ${verdict.status === 'APPROVED' ? 'bg-primary-600 hover:bg-primary-700' : 'bg-red-600 hover:bg-red-700'}`}>
            <Save className="h-6 w-6 mr-3" /> Finalizar Análisis
          </Button>
        </div>
      </form>
    </div>
  );
};
