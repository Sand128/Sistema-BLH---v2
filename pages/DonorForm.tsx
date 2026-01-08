
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, FileText, Activity, Calculator, Info, Plus, Trash2, AlertTriangle, Edit, Baby } from 'lucide-react';
import { donorService } from '../services/donorService';
import { authService } from '../services/authService';
import { Button } from '../components/ui/Button';
import { Donor, LabTestDetail, PathologyDetail, MedicationDetail } from '../types';

const INITIAL_LAB_TESTS = [
  'Hematocrito', 'Hemoglobina', 'Prueba de VIH', 'VDRL', 'Hepatitis C', 'Hepatitis B', 'Otros'
];

const INITIAL_PATHOLOGIES = [
  'Transfusión de sangre (últimos 5 años)',
  'Tatuajes',
  'Piercings',
  'Acupuntura',
  'Contacto con material punzocortante',
  'Otros'
];

// --- Estilos y Componentes Auxiliares ---

const inputClass = "w-full p-2.5 border border-[#C6C6C6] rounded-md text-base bg-[#F2F4F7] text-[#333333] placeholder-[#9A9A9A] focus:ring-2 focus:ring-pink-500 focus:border-pink-500 focus:bg-white outline-none transition-all shadow-sm";
const tableInputClass = "w-full p-2 text-base border border-[#C6C6C6] rounded-md bg-[#F2F4F7] text-[#333333] placeholder-[#9A9A9A] focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 disabled:bg-slate-200";
const checkboxClass = "h-5 w-5 text-pink-600 rounded border-slate-300 focus:ring-pink-500 cursor-pointer";

const SectionHeader = ({ title }: { title: string }) => (
  <div className="border-b-2 border-slate-200 pb-3 mb-6 mt-4">
    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
      <span className="w-1.5 h-6 bg-pink-600 rounded-full inline-block"></span>
      {title}
    </h3>
  </div>
);

const Label = ({ children, required }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-sm font-bold text-slate-700 uppercase mb-2 tracking-wide">
    {children} {required && <span className="text-red-600 text-lg align-middle">*</span>}
  </label>
);

const InputGroup = ({ className = "", children }: { className?: string, children?: React.ReactNode }) => (
  <div className={className}>{children}</div>
);

export const DonorForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  
  const currentUser = authService.getCurrentUser();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<Donor>>({
    folio: '',
    fileNumber: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    occupation: '',
    religion: '',
    phone: '',
    email: '',
    address: '',
    addressReferences: '',
    prenatalControlEntity: '',
    deliveryDate: '',
    infantAgeWeeks: 0,
    gestationalAgeWeeks: 38,
    infantHospitalized: false,
    infantHospitalService: '',
    weightPreGestational: 0,
    weightCurrent: 0,
    height: 0,
    bmi: 0,
    pregnancyInfections: false,
    infectionTrimester: '',
    pregnancyComplications: '',
    toxicSubstances: false,
    chemicalExposure: false,
    recentVaccines: false,
    bloodTransfusionRisk: false,
    pathologies: INITIAL_PATHOLOGIES.map(name => ({
      name,
      present: false,
      specification: '',
      timeElapsed: ''
    })),
    isTakingMedication: false,
    medicationsList: [
        { name: '', dosage: '', reason: '', startDate: '', endDate: '' },
        { name: '', dosage: '', reason: '', startDate: '', endDate: '' },
        { name: '', dosage: '', reason: '', startDate: '', endDate: '' }
    ],
    gestations: 0,
    deliveries: 0,
    cesareans: 0,
    abortions: 0,
    sexualPartners: 1,
    contraceptiveMethod: '',
    anomalies: '',
    bloodType: '',
    labTests: INITIAL_LAB_TESTS.map(name => ({
      name,
      before: { performed: false, date: '', result: '' },
      during: { performed: false, date: '', result: '' },
      after: { performed: false, date: '', result: '' },
      lastResultDate: ''
    })),
    status: 'SCREENING',
    donationType: 'HETEROLOGOUS',
    rejectionReason: '',
    donationReason: 'SURPLUS',
    donorCategory: 'EXTERNAL',
    interviewerName: currentUser?.name || '',
    elaboratorName: currentUser?.name || '',
    medicalNotes: '',
    obstetricEventType: 'PARTO'
  });

  useEffect(() => {
    if (isEdit && id) {
      loadDonor(id);
    }
  }, [id]);

  const loadDonor = async (donorId: string) => {
    try {
      const donor = await donorService.getById(donorId);
      if (donor) {
        setFormData(donor);
      } else {
        alert('Donadora no encontrada');
        navigate('/donors');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (formData.weightCurrent && formData.height) {
      const heightM = formData.height / 100;
      const bmi = parseFloat((formData.weightCurrent / (heightM * heightM)).toFixed(2));
      setFormData(prev => ({ ...prev, bmi }));
    }
  }, [formData.weightCurrent, formData.height]);

  useEffect(() => {
    if (formData.deliveryDate) {
      const delivery = new Date(formData.deliveryDate);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - delivery.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffDays / 7);
      setFormData(prev => ({ ...prev, infantAgeWeeks: weeks }));
    }
  }, [formData.deliveryDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === 'email' && errors.email) {
        setErrors(prev => ({ ...prev, email: '' }));
    }
    let parsedValue: any = value;
    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    } 
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLabChange = (index: number, stage: 'before' | 'during' | 'after' | 'root', field: string, value: any) => {
    const updatedLabs = [...(formData.labTests || [])];
    const test = updatedLabs[index];
    if (stage === 'root') {
        (test as any)[field] = value;
    } else {
        (test as any)[stage][field] = value;
    }
    setFormData(prev => ({ ...prev, labTests: updatedLabs }));
  };

  const handlePathologyChange = (index: number, field: keyof PathologyDetail, value: any) => {
    const updatedPathologies = [...(formData.pathologies || [])];
    updatedPathologies[index] = { ...updatedPathologies[index], [field]: value };
    setFormData(prev => ({ ...prev, pathologies: updatedPathologies }));
  };

  const handleMedicationChange = (index: number, field: keyof MedicationDetail, value: string) => {
    const updatedMeds = [...(formData.medicationsList || [])];
    updatedMeds[index] = { ...updatedMeds[index], [field]: value };
    setFormData(prev => ({ ...prev, medicationsList: updatedMeds }));
  };

  const addMedicationRow = () => {
      setFormData(prev => ({
          ...prev,
          medicationsList: [...(prev.medicationsList || []), { name: '', dosage: '', reason: '', startDate: '', endDate: '' }]
      }));
  };

  const removeMedicationRow = (index: number) => {
     const updatedMeds = [...(formData.medicationsList || [])];
     updatedMeds.splice(index, 1);
     setFormData(prev => ({ ...prev, medicationsList: updatedMeds }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
        setErrors(prev => ({ ...prev, email: 'Por favor, introduzca un correo electrónico válido.' }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }
    setLoading(true);
    try {
      if (isEdit && id) {
        const result = await donorService.update(id, formData);
        alert('Expediente actualizado correctamente.');
        navigate(`/donors/${id}`);
      } else {
        const result = await donorService.create(formData as Donor);
        if (result.status === 'REJECTED') {
            alert(`Donadora registrada pero RECHAZADA por: \n ${result.rejectionReason}`);
        } else {
            alert('Donadora registrada exitosamente y APTA.');
        }
        navigate('/donors');
      }
    } catch (error) {
      console.error(error);
      alert('Error al guardar el expediente.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-12 text-center text-slate-500 animate-pulse font-bold italic">Cargando expediente para edición...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-6 pt-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-colors">
          <ChevronLeft className="h-7 w-7" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-pink-600" />
            {isEdit ? 'Actualizar Expediente' : 'Registro Clínico de Donadora'}
          </h1>
          <p className="text-base text-slate-500 mt-1">
            {isEdit ? `Editando registro: ${formData.firstName} ${formData.lastName}` : 'Formato oficial de ingreso al Banco de Leche Humana.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* FICHA DE IDENTIFICACIÓN */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
          <SectionHeader title="Ficha de Identificación" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <InputGroup>
                <Label required>Fecha Registro</Label>
                <input type="date" className={`${inputClass} bg-slate-100 text-slate-600 font-semibold`} readOnly value={formData.registrationDate || new Date().toISOString().split('T')[0]} />
             </InputGroup>
             <InputGroup>
                <Label required>Folio BLH</Label>
                <input name="folio" value={formData.folio} onChange={handleChange} className={inputClass} placeholder="Ej. BLH-2024-001" required />
             </InputGroup>
             <InputGroup>
                <Label required>No. Expediente</Label>
                <input name="fileNumber" value={formData.fileNumber} onChange={handleChange} className={inputClass} required />
             </InputGroup>
             <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup className="md:col-span-1">
                    <Label required>Nombre(s)</Label>
                    <input name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} required />
                </InputGroup>
                <InputGroup className="md:col-span-1">
                    <Label required>Apellidos</Label>
                    <input name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} required />
                </InputGroup>
                <InputGroup>
                  <Label required>Fecha Nacimiento</Label>
                  <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={inputClass} required />
                </InputGroup>
             </div>
             <InputGroup className="md:col-span-2">
                <Label required>Dirección Completa</Label>
                <input name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="Calle, Número, Colonia, Municipio" required />
             </InputGroup>
             <InputGroup className="md:col-span-2">
                <Label>Referencias Domicilio</Label>
                <input name="addressReferences" value={formData.addressReferences} onChange={handleChange} className={inputClass} placeholder="Entre calles, color de fachada..." />
             </InputGroup>
             <InputGroup>
                <Label required>Teléfono (Lada)</Label>
                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} className={inputClass} required />
             </InputGroup>
             <InputGroup>
                <Label>Ocupación</Label>
                <input name="occupation" value={formData.occupation} onChange={handleChange} className={inputClass} />
             </InputGroup>
             <InputGroup>
                <Label>Religión</Label>
                <input name="religion" value={formData.religion} onChange={handleChange} className={inputClass} />
             </InputGroup>
              <InputGroup>
                <Label required>Email</Label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className={`${inputClass} ${errors.email ? 'border-red-500 focus:ring-red-500 text-red-900' : ''}`} required />
                {errors.email && <p className="mt-1 text-sm text-red-600 font-medium">{errors.email}</p>}
             </InputGroup>
          </div>
        </div>

        {/* CRITERIOS DE EXCLUSIÓN */}
        <div className="bg-red-50 shadow-md rounded-2xl border border-red-200 p-8">
            <SectionHeader title="Criterios de Exclusión (Validación Clínica)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="flex items-start gap-4 p-4 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
                    <input type="checkbox" checked={formData.toxicSubstances} onChange={(e) => handleCheckboxChange('toxicSubstances', e.target.checked)} className="mt-1 h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                    <div>
                        <span className="block font-bold text-slate-800">Consumo de Sustancias Tóxicas</span>
                        <span className="text-sm text-slate-600">Alcohol, tabaco, drogas recreativas o medicamentos no recetados.</span>
                    </div>
                </label>
                <label className="flex items-start gap-4 p-4 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
                    <input type="checkbox" checked={formData.chemicalExposure} onChange={(e) => handleCheckboxChange('chemicalExposure', e.target.checked)} className="mt-1 h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                    <div>
                        <span className="block font-bold text-slate-800">Exposición Química</span>
                        <span className="text-sm text-slate-600">Contacto con pesticidas, solventes o ambiente contaminado.</span>
                    </div>
                </label>
                <label className="flex items-start gap-4 p-4 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
                    <input type="checkbox" checked={formData.recentVaccines} onChange={(e) => handleCheckboxChange('recentVaccines', e.target.checked)} className="mt-1 h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                    <div>
                        <span className="block font-bold text-slate-800">Vacunación Reciente</span>
                        <span className="text-sm text-slate-600">Vacunas con virus vivos atenuados en las últimas 4 semanas.</span>
                    </div>
                </label>
                <label className="flex items-start gap-4 p-4 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors cursor-pointer">
                    <input type="checkbox" checked={formData.bloodTransfusionRisk} onChange={(e) => handleCheckboxChange('bloodTransfusionRisk', e.target.checked)} className="mt-1 h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500" />
                    <div>
                        <span className="block font-bold text-slate-800">Riesgo Sanguíneo</span>
                        <span className="text-sm text-slate-600">Transfusiones de sangre en los últimos 5 años.</span>
                    </div>
                </label>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-red-700 font-medium">
                <AlertTriangle className="h-5 w-5" />
                <p>Marcar cualquiera de estas casillas clasificará automáticamente a la donadora como <strong>NO APTA</strong>.</p>
            </div>
        </div>

        {/* ANTECEDENTES PERINATALES */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
          <SectionHeader title="Antecedentes Perinatales" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <InputGroup className="md:col-span-2">
               <Label required>Institución Control Prenatal</Label>
               <input name="prenatalControlEntity" value={formData.prenatalControlEntity} onChange={handleChange} className={inputClass} placeholder="Ej. Centro de Salud, Hospital General..." />
            </InputGroup>
            <InputGroup>
               <Label required>Fecha Parto/Cesárea</Label>
               <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className={inputClass} required />
            </InputGroup>
            <InputGroup>
               <Label>Edad Lactante (Semanas)</Label>
               <div className="relative">
                 <input type="number" readOnly value={formData.infantAgeWeeks} className={`${inputClass} bg-slate-100 font-bold pr-10`} />
                 <Calculator className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
               </div>
            </InputGroup>
             <InputGroup>
               <Label>Edad Gestacional (Semanas)</Label>
               <input type="number" name="gestationalAgeWeeks" value={formData.gestationalAgeWeeks} onChange={handleChange} className={inputClass} />
            </InputGroup>
            <InputGroup className="md:col-span-3 flex items-end gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center h-12">
                   <input type="checkbox" id="infantHospitalized" checked={formData.infantHospitalized} onChange={(e) => handleCheckboxChange('infantHospitalized', e.target.checked)} className={checkboxClass} />
                   <label htmlFor="infantHospitalized" className="ml-3 text-base font-medium text-slate-800 cursor-pointer select-none">¿Lactante Hospitalizado?</label>
                </div>
                <div className="flex-1">
                   <Label>Servicio / Ubicación</Label>
                   <input name="infantHospitalService" value={formData.infantHospitalService} onChange={handleChange} disabled={!formData.infantHospitalized} className={`${inputClass} disabled:opacity-50 disabled:bg-slate-200`} placeholder={formData.infantHospitalized ? "Ej. UCIN, Cuneros..." : "N/A"} />
                </div>
            </InputGroup>
            <div className="md:col-span-4 border-t border-slate-200 my-4"></div>
            <InputGroup>
                <Label>Peso Pregestacional (kg)</Label>
                <input type="number" step="0.1" name="weightPreGestational" value={formData.weightPreGestational} onChange={handleChange} className={inputClass} />
            </InputGroup>
            <InputGroup>
                <Label required>Peso Actual (kg)</Label>
                <input type="number" step="0.1" name="weightCurrent" value={formData.weightCurrent} onChange={handleChange} className={inputClass} required />
            </InputGroup>
            <InputGroup>
                <Label required>Talla (cm)</Label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClass} required placeholder="Ej. 160" />
            </InputGroup>
            <InputGroup>
                <Label>IMC Actual</Label>
                <div className={`flex items-center justify-between p-3 rounded-lg border text-base font-bold shadow-sm ${ (formData.bmi || 0) < 18.5 ? 'bg-amber-50 text-amber-800 border-amber-200' : (formData.bmi || 0) > 30 ? 'bg-orange-50 text-orange-800 border-orange-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200' }`}>
                    <span>{formData.bmi}</span>
                    <Activity className="h-5 w-5" />
                </div>
            </InputGroup>
             <InputGroup className="md:col-span-4 flex flex-col md:flex-row items-start gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="min-w-[180px] pt-2">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={formData.pregnancyInfections} onChange={(e) => handleCheckboxChange('pregnancyInfections', e.target.checked)} className={checkboxClass} />
                      <span className="text-base font-bold text-slate-800">¿Infecciones Embarazo?</span>
                   </label>
                </div>
                {formData.pregnancyInfections && (
                  <div className="flex flex-1 gap-6 w-full">
                    <div className="w-1/3">
                      <Label>Trimestre</Label>
                      <select name="infectionTrimester" value={formData.infectionTrimester} onChange={handleChange} className={inputClass}>
                         <option value="">Seleccionar...</option>
                         <option value="1">1er Trimestre</option>
                         <option value="2">2do Trimestre</option>
                         <option value="3">3er Trimestre</option>
                      </select>
                    </div>
                     <div className="flex-1">
                      <Label>Especificar / Complicaciones</Label>
                      <input name="pregnancyComplications" value={formData.pregnancyComplications} onChange={handleChange} className={inputClass} placeholder="IVU, Preeclampsia, etc." />
                    </div>
                  </div>
                )}
             </InputGroup>
          </div>
        </div>

        {/* ANTECEDENTES PATOLÓGICOS */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
            <SectionHeader title="Antecedentes Patológicos Personales de la Madre" />
            
            <div className="mb-8 w-full md:w-1/3 bg-blue-50 p-4 rounded-xl border border-blue-200">
                <Label required>Tipo de Evento Obstétrico</Label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Baby className="h-5 w-5 text-blue-500" />
                    </div>
                    <select 
                        name="obstetricEventType" 
                        value={formData.obstetricEventType} 
                        onChange={handleChange} 
                        className={`${inputClass} pl-10 font-bold text-blue-900 border-blue-300`} 
                        required
                    >
                        <option value="PARTO">Parto Eutócico</option>
                        <option value="CESAREA">Cesárea</option>
                    </select>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 uppercase tracking-wider">Antecedente</th>
                            <th className="px-6 py-4 text-center text-sm font-bold text-slate-800 uppercase w-24">Sí / No</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 uppercase">Especificar</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 uppercase">Hace cuánto tiempo</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {formData.pathologies?.map((pathology, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                <td className="px-6 py-4 text-base font-medium text-slate-900">{pathology.name === 'Otros' ? <span className="italic text-slate-500 font-normal">Otros</span> : pathology.name}</td>
                                <td className="px-6 py-4 text-center"><input type="checkbox" checked={pathology.present} onChange={(e) => handlePathologyChange(idx, 'present', e.target.checked)} className={checkboxClass} /></td>
                                <td className="px-6 py-3"><input type="text" value={pathology.specification || ''} onChange={(e) => handlePathologyChange(idx, 'specification', e.target.value)} disabled={!pathology.present} className={tableInputClass} placeholder={pathology.name === 'Otros' ? 'Especifique...' : ''} /></td>
                                <td className="px-6 py-3"><input type="text" value={pathology.timeElapsed || ''} onChange={(e) => handlePathologyChange(idx, 'timeElapsed', e.target.value)} disabled={!pathology.present} className={tableInputClass} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* TRATAMIENTO FARMACOLÓGICO */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
            <SectionHeader title="Tratamiento Farmacológico" />
            <div className="mb-6 flex items-center gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <span className="text-base font-bold text-slate-900">¿Toma algún medicamento actualmente?</span>
                <div className="flex items-center gap-8 ml-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="isTakingMedication" checked={formData.isTakingMedication === true} onChange={() => setFormData(prev => ({ ...prev, isTakingMedication: true }))} className="h-5 w-5 text-pink-600 focus:ring-pink-500" />
                        <span className="text-base text-slate-700 font-medium">Sí</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="isTakingMedication" checked={formData.isTakingMedication === false} onChange={() => setFormData(prev => ({ ...prev, isTakingMedication: false }))} className="h-5 w-5 text-pink-600 focus:ring-pink-500" />
                        <span className="text-base text-slate-700 font-medium">No</span>
                     </label>
                </div>
            </div>
            {formData.isTakingMedication && (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase">Nombre del Fármaco</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase">Dosis / Presentación</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase">Motivo</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase">Inicio</th>
                                <th className="px-4 py-3 text-left text-sm font-bold text-slate-800 uppercase">Término</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {formData.medicationsList?.map((med, idx) => (
                                <tr key={idx}>
                                    <td className="px-3 py-3"><input value={med.name} onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)} className={tableInputClass} placeholder="Nombre..." /></td>
                                    <td className="px-3 py-3"><input value={med.dosage} onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)} className={tableInputClass} placeholder="500mg..." /></td>
                                    <td className="px-3 py-3"><input value={med.reason} onChange={(e) => handleMedicationChange(idx, 'reason', e.target.value)} className={tableInputClass} /></td>
                                    <td className="px-3 py-3"><input type="date" value={med.startDate} onChange={(e) => handleMedicationChange(idx, 'startDate', e.target.value)} className={tableInputClass} /></td>
                                    <td className="px-3 py-3"><input type="date" value={med.endDate} onChange={(e) => handleMedicationChange(idx, 'endDate', e.target.value)} className={tableInputClass} /></td>
                                    <td className="px-3 py-3 text-center">{formData.medicationsList!.length > 1 && <button type="button" onClick={() => removeMedicationRow(idx)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="h-5 w-5" /></button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="bg-slate-50 p-3 border-t border-slate-200">
                         <Button type="button" variant="outline" onClick={addMedicationRow} className="text-sm border-slate-300 text-slate-700"><Plus className="h-4 w-4 mr-2" /> Agregar Fila</Button>
                    </div>
                </div>
            )}
        </div>

        {/* GINECO-OBSTÉTRICOS */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
            <SectionHeader title="Antecedentes Gineco-Obstétricos" />
            <div className="grid grid-cols-4 gap-6 mb-8 text-center bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <InputGroup><Label>Gestas</Label><input type="number" name="gestations" value={formData.gestations} onChange={handleChange} className={`${inputClass} text-center font-bold text-lg`} /></InputGroup>
                   <InputGroup><Label>Partos</Label><input type="number" name="deliveries" value={formData.deliveries} onChange={handleChange} className={`${inputClass} text-center font-bold text-lg`} /></InputGroup>
                   <InputGroup><Label>Cesáreas</Label><input type="number" name="cesareans" value={formData.cesareans} onChange={handleChange} className={`${inputClass} text-center font-bold text-lg`} /></InputGroup>
                   <InputGroup><Label>Abortos</Label><input type="number" name="abortions" value={formData.abortions} onChange={handleChange} className={`${inputClass} text-center font-bold text-lg`} /></InputGroup>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-6">
                    <InputGroup><Label>Parejas Sexuales</Label><input type="number" name="sexualPartners" value={formData.sexualPartners} onChange={handleChange} className={inputClass} /></InputGroup>
                    <InputGroup><Label>Método Anticonceptivo</Label><input name="contraceptiveMethod" value={formData.contraceptiveMethod} onChange={handleChange} className={inputClass} /></InputGroup>
                </div>
                <InputGroup><Label>Anomalías</Label><input name="anomalies" value={formData.anomalies} onChange={handleChange} className={inputClass} placeholder="Especificar..." /></InputGroup>
            </div>
        </div>

        {/* EXÁMENES DE LABORATORIO */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
            <SectionHeader title="Exámenes de Laboratorio" />
            <div className="mb-6 w-full md:w-1/3">
                 <Label required>Grupo Sanguíneo</Label>
                 <select name="bloodType" value={formData.bloodType} onChange={handleChange} className={`${inputClass} font-bold text-blue-900 bg-blue-50 border-blue-200`} required>
                    <option value="">Seleccionar...</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                 </select>
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-4 py-4 text-left font-bold text-slate-800 uppercase min-w-[180px]">Prueba de Laboratorio</th>
                            <th className="px-2 py-4 text-center font-bold text-slate-800 uppercase border-l border-slate-200">Antes del Embarazo</th>
                            <th className="px-2 py-4 text-center font-bold text-slate-800 uppercase border-l border-slate-200">Durante el Embarazo</th>
                            <th className="px-2 py-4 text-center font-bold text-slate-800 uppercase border-l border-slate-200">Después del Embarazo</th>
                            <th className="px-4 py-4 text-center font-bold text-slate-800 uppercase border-l border-slate-200 w-40">Último Resultado</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {formData.labTests?.map((test, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900 text-base">{test.name === 'Otros' ? <input placeholder="Especifique otro..." className="w-full bg-transparent border-b border-gray-300 focus:border-pink-500 outline-none placeholder-[#9A9A9A] text-[#333333]" /> : test.name}</td>
                                {['before', 'during', 'after'].map((stage) => (
                                    <td key={stage} className="px-2 py-3 border-l border-slate-200 align-top">
                                        <div className="flex flex-col gap-2 p-1">
                                            <label className="flex items-center justify-center gap-2 cursor-pointer mb-1 bg-slate-50 p-1 rounded hover:bg-slate-200 transition-colors">
                                                <input type="checkbox" checked={(test as any)[stage].performed} onChange={(e) => handleLabChange(idx, stage as any, 'performed', e.target.checked)} className={checkboxClass} />
                                                <span className="text-xs font-bold text-slate-600 uppercase">Sí</span>
                                            </label>
                                            {(test as any)[stage].performed && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                                                    <input type="date" value={(test as any)[stage].date} onChange={(e) => handleLabChange(idx, stage as any, 'date', e.target.value)} className="w-full text-xs border border-[#C6C6C6] rounded px-2 py-1 bg-[#F2F4F7] text-[#333333]" />
                                                    <select 
                                                        value={(test as any)[stage].result} 
                                                        onChange={(e) => handleLabChange(idx, stage as any, 'result', e.target.value)} 
                                                        required
                                                        className={`w-full text-xs border rounded px-2 py-1 font-bold outline-none focus:ring-1 focus:ring-pink-500 ${ (test as any)[stage].result === 'REACTIVO' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-slate-700 border-[#C6C6C6]' }`}
                                                    >
                                                        <option value="">-- Resultado --</option>
                                                        <option value="NO_REACTIVO">No Reactivo</option>
                                                        <option value="REACTIVO">Reactivo</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                ))}
                                <td className="px-4 py-3 border-l border-slate-200"><input type="date" value={test.lastResultDate} onChange={(e) => handleLabChange(idx, 'root', 'lastResultDate', e.target.value)} className={tableInputClass} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* DICTAMEN Y CLASIFICACIÓN */}
        <div className="bg-white shadow-md rounded-2xl border border-slate-200 p-8">
           <SectionHeader title="Resultado de la Entrevista y Clasificación" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <InputGroup>
                <Label required>Tipo de Donación (Apta)</Label>
                <select name="donationType" value={formData.donationType} onChange={handleChange} className={`${inputClass} font-bold text-lg`}>
                    <option value="HETEROLOGOUS">Heteróloga (Donante Externa)</option>
                    <option value="HOMOLOGOUS">Homóloga (Propio Hijo)</option>
                    <option value="MIXED">Mixta</option>
                    <option value="REJECTED">NO APTA</option>
                </select>
                </InputGroup>
                {formData.donationType === 'REJECTED' && <InputGroup><Label required>Motivo de Rechazo</Label><input name="rejectionReason" value={formData.rejectionReason} onChange={handleChange} className={`${inputClass} border-red-300 bg-red-50 text-red-900`} placeholder="Especificar causa..." /></InputGroup>}
                <InputGroup>
                <Label>Motivo Donación</Label>
                <select name="donationReason" value={formData.donationReason} onChange={handleChange} className={inputClass}>
                    <option value="SURPLUS">Excedente de Leche</option>
                    <option value="DEATH">Muerte Neonatal</option>
                    <option value="OTHER">Otro</option>
                </select>
                </InputGroup>
                <InputGroup>
                <Label>Clasificación Donadora</Label>
                <select name="donorCategory" value={formData.donorCategory} onChange={handleChange} className={inputClass}>
                    <option value="EXTERNAL">Externa</option>
                    <option value="INTERNAL">Interna (Hospitalizada)</option>
                    <option value="HOME">En Casa (Recolección Domicilio)</option>
                    <option value="LACTARIUM">Asistente a Lactario</option>
                </select>
                </InputGroup>
            </div>
        </div>

        {/* RESPONSABLES Y FIRMAS */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
           <SectionHeader title="Validación y Responsables" />
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputGroup><Label>Entrevista Realizada Por:</Label><input name="interviewerName" value={formData.interviewerName} onChange={handleChange} className={`${inputClass} bg-white`} /></InputGroup>
               <InputGroup><Label>Elaboró (Captura en Sistema):</Label><input name="elaboratorName" value={formData.elaboratorName} readOnly className={`${inputClass} bg-slate-200 text-slate-500`} /></InputGroup>
           </div>
           <div className="mt-8 flex items-center gap-4 text-base text-slate-600 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <Info className="h-6 w-6 text-blue-500" />
              <p>Al guardar, el sistema validará automáticamente los criterios clínicos. Si la donadora cumple, se marcará como <strong>ACTIVA</strong>; de lo contrario, se marcará como <strong>NO APTA</strong>.</p>
           </div>
        </div>

        <div className="flex justify-end gap-6 pt-6 border-t border-slate-200">
           <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/donors/${id}` : '/donors')} className="w-40 text-base py-3">Cancelar</Button>
           <Button type="submit" isLoading={loading} className="w-64 bg-pink-600 hover:bg-pink-700 text-base py-3 font-bold shadow-lg shadow-pink-200">
              <Save className="h-5 w-5 mr-2" />
              {isEdit ? 'Actualizar Cambios' : 'Validar y Guardar'}
           </Button>
        </div>
      </form>
    </div>
  );
};
