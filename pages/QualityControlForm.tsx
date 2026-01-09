
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Save, AlertTriangle, CheckCircle, XCircle, 
  Info, Eye, ShieldAlert, HeartPulse, Stethoscope, Zap
} from 'lucide-react';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { Batch } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Definición de la Matriz de Color según lineamientos ISEM
interface ColorOption {
  id: string;
  name: string;
  hex: string;
  status: 'APTO' | 'NO_APTO';
  description: string;
  risk?: string;
  canBeHomologous?: boolean; // Excepción para sangre
}

const COLOR_OPTIONS: ColorOption[] = [
  // APTOS
  { id: 'C1', name: 'Blanco', hex: '#FFFFFF', status: 'APTO', description: 'Dispersión de luz por glóbulos de grasa y caseína.' },
  { id: 'C2', name: 'Blanquecino / Opaco', hex: '#F9F9F4', status: 'APTO', description: 'Fase intermedia; alta concentración de caseína.' },
  { id: 'C3', name: 'Amarillento / Intenso', hex: '#FFF59D', status: 'APTO', description: 'Presencia de carotenos (etapa final de extracción).' },
  { id: 'C4', name: 'Azulado', hex: '#E3F2FD', status: 'APTO', description: 'Predominio de fracción hidrosoluble (inicio).' },
  { id: 'C5', name: 'Verdoso', hex: '#E8F5E9', status: 'APTO', description: 'Asociado a dieta materna (vegetales o algas).' },
  { id: 'C6', name: 'Agua de coco', hex: '#F0F4F8', status: 'APTO', description: 'Predominio hidrosoluble al inicio de extracción.' },
  // NO APTOS
  { id: 'D1', name: 'Rojo-ladrillo', hex: '#B22222', status: 'NO_APTO', canBeHomologous: true, description: 'Presencia de sangre.', risk: 'Descarga papilar o fisuras en el pezón.' },
  { id: 'D2', name: 'Marrón oscuro', hex: '#5D4037', status: 'NO_APTO', canBeHomologous: true, description: 'Presencia de sangre o hemoglobina oxidada.', risk: 'Posible hemorragia capilar antigua.' },
  { id: 'D3', name: 'Rojo-naranja', hex: '#FF5722', status: 'NO_APTO', canBeHomologous: false, description: 'Contaminación bacteriana.', risk: 'Presencia de Serratia marcescens.' },
  { id: 'D4', name: 'Verde oscuro', hex: '#1B5E20', status: 'NO_APTO', canBeHomologous: false, description: 'Contaminación bacteriana.', risk: 'Presencia de Pseudomonas spp.' },
  { id: 'D5', name: 'Rosado / Anaranjado', hex: '#F06292', status: 'NO_APTO', canBeHomologous: false, description: 'Medicamentos o colorantes.', risk: 'Uso de fármacos o aditivos artificiales.' },
];

export const QualityControlForm: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Color Exception Logic
  const [medicalOverride, setMedicalOverride] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    acidityDornic: '',
    crematocrit: '',
    flavor: 'NORMAL',
    colorId: '', // Changed to use ID from COLOR_OPTIONS
    packagingState: 'OK',
    coliformsPresence: 'false',
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

  const selectedColor = COLOR_OPTIONS.find(c => c.id === formData.colorId);
  const isHomologousBatch = batch?.type === 'HOMOLOGOUS';

  // --- Crematocrito Classification Logic ---
  const getCaloricClassification = (value: string): 'HIPOCALÓRICA' | 'NORMOCALÓRICA' | 'HIPERCALÓRICA' | '' => {
    const num = Number(value);
    if (!value || isNaN(num)) return '';
    if (num < 500) return 'HIPOCALÓRICA';
    if (num <= 700) return 'NORMOCALÓRICA';
    return 'HIPERCALÓRICA';
  };

  const caloricClassification = getCaloricClassification(formData.crematocrit);
  
  // Logic: Check if the current state results in a rejected batch
  const calculateVerdict = () => {
    const acidity = Number(formData.acidityDornic);
    const hasColiforms = formData.coliformsPresence === 'true';
    
    let colorRejected = false;
    if (selectedColor && selectedColor.status === 'NO_APTO') {
        // Excepción: Si es sangre y el lote es homólogo y hay override médico
        const canOverride = isHomologousBatch && selectedColor.canBeHomologous && medicalOverride;
        if (!canOverride) {
            colorRejected = true;
        }
    }

    if (acidity > 8 || hasColiforms || colorRejected) {
      return { status: 'REJECTED', label: 'RECHAZADO', color: 'text-red-700', bg: 'bg-red-50 border-red-200' };
    }
    return { status: 'APPROVED', label: 'APROBADO', color: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !user || !selectedColor || !caloricClassification) {
        if (!caloricClassification) alert("Debe ingresar un valor de crematocrito válido.");
        return;
    }

    setSaving(true);
    try {
      await batchService.addQualityControl({
        batchId,
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Registro de Control de Calidad</h1>
          <p className="text-base text-slate-600 mt-1">Lote: <span className="font-bold">{batch.batchNumber}</span> ({isHomologousBatch ? 'HOMÓLOGO' : 'HETERÓLOGO'})</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        
        {/* ISEM INSTRUCTIONAL RIBBON */}
        <div className="bg-primary-900 text-white px-6 py-3 flex items-center gap-3">
            <Info className="h-5 w-5 text-primary-300" />
            <p className="text-sm font-bold uppercase tracking-wide">
                Instrucción Técnica: Realice la evaluación a contraluz. Registre la primera observación de color tras el deshielo.
            </p>
        </div>

        <div className="p-8 space-y-10">
          
          {/* SENSORY ANALYSIS: COLOR SELECTOR (ISEM GUIDELINES) */}
          <section>
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-3">
                <h3 className="text-xl font-black leading-6 text-slate-900 flex items-center gap-2">
                    <Eye className="h-6 w-6 text-primary-500" />
                    Evaluación Sensorial: Color
                </h3>
                {selectedColor && (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                        selectedColor.status === 'APTO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                        {selectedColor.status === 'APTO' ? 'Color Aceptable' : 'Motivo de Descarte'}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                {COLOR_OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                            setFormData(prev => ({ ...prev, colorId: opt.id }));
                            setMedicalOverride(false);
                        }}
                        className={`relative group flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                            formData.colorId === opt.id 
                            ? (opt.status === 'APTO' ? 'border-emerald-500 bg-emerald-50 shadow-md scale-105' : 'border-red-500 bg-red-50 shadow-md scale-105')
                            : 'border-slate-100 hover:border-slate-300 bg-white'
                        }`}
                    >
                        <div 
                            className="h-12 w-12 rounded-full border border-slate-200 shadow-inner mb-2"
                            style={{ backgroundColor: opt.hex }}
                        />
                        <span className="text-[10px] font-black text-center leading-tight uppercase text-slate-700">
                            {opt.name}
                        </span>
                        {formData.colorId === opt.id && (
                            <div className="absolute -top-2 -right-2">
                                {opt.status === 'APTO' 
                                    ? <CheckCircle className="h-5 w-5 text-emerald-600 fill-white" />
                                    : <XCircle className="h-5 w-5 text-red-600 fill-white" />
                                }
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* COLOR ALERT / OVERRIDE LOGIC */}
            {selectedColor && (
                <div className={`mt-6 p-5 rounded-xl border-2 animate-in fade-in slide-in-from-top-2 ${
                    selectedColor.status === 'APTO' ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-200'
                }`}>
                    <div className="flex gap-4">
                        {selectedColor.status === 'APTO' ? (
                            <div className="p-2 bg-white rounded-lg"><Info className="h-5 w-5 text-blue-500" /></div>
                        ) : (
                            <div className="p-2 bg-white rounded-lg"><ShieldAlert className="h-5 w-5 text-red-500" /></div>
                        )}
                        <div className="flex-1">
                            <h4 className={`text-sm font-black uppercase ${selectedColor.status === 'APTO' ? 'text-blue-900' : 'text-red-900'}`}>
                                {selectedColor.name}
                            </h4>
                            <p className="text-xs font-medium text-slate-700 mt-1">{selectedColor.description}</p>
                            {selectedColor.risk && (
                                <p className="text-xs font-bold text-red-700 mt-1 italic">Riesgo detectado: {selectedColor.risk}</p>
                            )}
                            
                            {/* Homologous Exception Trigger */}
                            {selectedColor.status === 'NO_APTO' && selectedColor.canBeHomologous && isHomologousBatch && (
                                <div className="mt-4 pt-4 border-t border-red-200">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-red-800">
                                            <HeartPulse className="h-5 w-5" />
                                            <p className="text-[10px] font-black uppercase">Excepción para Consumo Homólogo disponible</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setMedicalOverride(!medicalOverride)}
                                            className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                                                medicalOverride 
                                                ? 'bg-emerald-600 text-white shadow-lg' 
                                                : 'bg-white text-red-600 border border-red-300 hover:bg-red-100'
                                            }`}
                                        >
                                            {medicalOverride ? 'VALIDACIÓN MÉDICA ACTIVADA' : 'HABILITAR VALIDACIÓN MÉDICA'}
                                        </button>
                                    </div>
                                    {medicalOverride && (
                                        <div className="mt-3 p-3 bg-white/50 border border-emerald-200 rounded-lg flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-emerald-600" />
                                            <p className="text-[10px] text-emerald-800 font-bold uppercase">
                                                Confirmado: Se permite el consumo por el propio hijo bajo estricta vigilancia clínica.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedColor.status === 'NO_APTO' && (!selectedColor.canBeHomologous || !isHomologousBatch) && (
                                <p className="mt-2 text-[10px] font-black text-red-600 uppercase border border-red-200 p-2 bg-white/50 rounded-md">
                                    AVISO CRÍTICO: La muestra debe ser descartada para donación heteróloga. El frasco no avanzará a pasteurización.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
          </section>

          {/* PHYSICOCHEMICAL ANALYSIS */}
          <section>
            <h3 className="text-xl font-black leading-6 text-slate-900 mb-6 border-b border-slate-200 pb-3">Análisis Fisicoquímico</h3>
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
                            <AlertTriangle className="h-4 w-4 mr-2" /> Acidez > 8°D (Rechazo)
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
                    
                    {/* AUTOMATIC CALORIC CLASSIFICATION DISPLAY */}
                    {caloricClassification && (
                        <div className={`mt-2 p-3 rounded-lg border-2 flex items-center gap-3 transition-all animate-in zoom-in-95 ${
                            caloricClassification === 'HIPOCALÓRICA' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                            caloricClassification === 'NORMOCALÓRICA' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            'bg-indigo-50 border-indigo-200 text-indigo-800'
                        }`}>
                            <Zap className={`h-5 w-5 ${caloricClassification === 'HIPOCALÓRICA' ? 'text-amber-500' : caloricClassification === 'NORMOCALÓRICA' ? 'text-emerald-500' : 'text-indigo-500'}`} />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest">Dictamen Nutricional</p>
                                <p className="text-sm font-black">{caloricClassification}</p>
                            </div>
                        </div>
                    )}
                    
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase italic">
                        Norma: Hipocalórica (&lt;500) | Normocalórica (500-700) | Hipercalórica (&gt;700)
                    </p>
                </div>
            </div>
          </section>

          {/* ADDITIONAL CONTROLS */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            </div>
          </section>
          
          <div>
              <label htmlFor="notes" className={labelClass}>
                Observaciones Adicionales / Registro de Calidad
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base text-[#333333]"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Incluir detalles de no conformidad o destino final si se descarta."
              />
          </div>

          {/* DYNAMIC VERDICT PREVIEW */}
          <div className={`rounded-xl p-6 ${verdict.bg} border-2 transition-all duration-300`}>
              <div className="flex">
                  <div className="flex-shrink-0">
                      {verdict.status === 'APPROVED' ? 
                        <CheckCircle className={`h-8 w-8 ${verdict.color}`} /> : 
                        <XCircle className={`h-8 w-8 ${verdict.color}`} />
                      }
                  </div>
                  <div className="ml-4">
                      <h3 className={`text-xl font-black ${verdict.color}`}>
                          DICTAMEN FINAL: {verdict.label}
                      </h3>
                      <div className={`mt-2 text-base font-medium ${verdict.color}`}>
                          <p>
                              {verdict.status === 'APPROVED' 
                                ? 'El lote cumple con todos los criterios sensoriales y fisicoquímicos para su liberación.' 
                                : 'El lote no es apto para donación heteróloga y se registrará automáticamente como muestra inadecuada.'}
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
          <Button 
            type="submit" 
            isLoading={saving} 
            disabled={!formData.colorId || !caloricClassification}
            className={`w-56 shadow-lg ${verdict.status === 'APPROVED' ? 'bg-primary-600' : 'bg-red-600'}`}
          >
            <Save className="h-5 w-5 mr-2" />
            Finalizar Análisis
          </Button>
        </div>
      </form>
    </div>
  );
};
