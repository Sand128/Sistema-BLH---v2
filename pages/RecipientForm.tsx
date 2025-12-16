
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import { recipientService } from '../services/recipientService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const RecipientForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    gender: 'MALE',
    hospitalService: '',
    doctorName: '',
    diagnosis: '',
    weightGrams: '',
    status: 'ACTIVE'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recipientService.create({
          ...formData,
          weightGrams: Number(formData.weightGrams),
          gender: formData.gender as 'MALE' | 'FEMALE',
          status: formData.status as 'ACTIVE' | 'DISCHARGED'
      });
      navigate('/recipients');
    } catch (error) {
      console.error(error);
      alert('Error al guardar receptor');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-[#333333]";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Registrar Nuevo Receptor</h1>
          <p className="text-base text-slate-600 mt-1">Ingreso de paciente neonatal para administración de leche.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-6">
            
            <div className="sm:col-span-6 border-b border-slate-200 pb-3 mb-2">
              <h3 className="text-xl font-bold leading-6 text-slate-900">Datos del Paciente</h3>
            </div>

            <div className="sm:col-span-4">
              <Input
                label="Nombre Completo"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Apellidos, Nombres"
              />
            </div>

            <div className="sm:col-span-2">
                <label className={labelClass}>Sexo</label>
                <select
                    name="gender"
                    className={selectClass}
                    value={formData.gender}
                    onChange={handleChange}
                >
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                </select>
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Fecha de Nacimiento"
                name="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Peso al nacer (gramos)"
                name="weightGrams"
                type="number"
                value={formData.weightGrams}
                onChange={handleChange}
                required
              />
            </div>

            <div className="sm:col-span-6 border-b border-slate-200 pb-3 mb-2 mt-6">
              <h3 className="text-xl font-bold leading-6 text-slate-900">Ubicación y Diagnóstico</h3>
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Servicio Hospitalario"
                name="hospitalService"
                value={formData.hospitalService}
                onChange={handleChange}
                required
                placeholder="Ej. UCIN, Pediatría A"
              />
            </div>

            <div className="sm:col-span-3">
              <Input
                label="Médico Tratante"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleChange}
                required
                placeholder="Dr/Dra."
              />
            </div>

            <div className="sm:col-span-6">
              <Input
                label="Diagnóstico / Motivo de Prescripción"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                required
              />
            </div>

          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate('/recipients')} className="w-32">
            Cancelar
          </Button>
          <Button type="submit" isLoading={loading} className="w-48 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200">
            <Save className="h-5 w-5 mr-2" />
            Guardar Paciente
          </Button>
        </div>
      </form>
    </div>
  );
};
