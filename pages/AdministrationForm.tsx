
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Syringe, Milk, User, AlertCircle } from 'lucide-react';
import { batchService } from '../services/batchService';
import { recipientService } from '../services/recipientService';
import { authService } from '../services/authService';
import { Batch, Recipient } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AdministrationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const preselectedBatchId = location.state?.batchId;
  const preselectedRecipientId = location.state?.recipientId;

  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    recipientId: preselectedRecipientId || '',
    batchId: preselectedBatchId || '',
    volume: '',
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [rData, bData] = await Promise.all([
            recipientService.getAll(),
            batchService.getAll()
        ]);
        setRecipients(rData.filter(r => r.status === 'ACTIVE'));
        
        // Filter: Status APPROVED, Volume > 0, and Not Expired
        const today = new Date().toISOString().split('T')[0];
        const validBatches = bData.filter(b => 
            b.status === 'APPROVED' && 
            b.currentVolume > 0 &&
            (!b.expirationDate || b.expirationDate >= today)
        );
        
        setBatches(validBatches);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedBatch = batches.find(b => b.id === formData.batchId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const volume = Number(formData.volume);
    if (!selectedBatch) return;
    if (volume > selectedBatch.currentVolume) {
        alert("El volumen a administrar excede la cantidad disponible en el lote.");
        return;
    }

    setSubmitting(true);
    try {
      await recipientService.administerMilk(
          formData.recipientId,
          formData.batchId,
          volume,
          user.name,
          formData.notes
      );
      navigate(`/recipients/${formData.recipientId}`);
    } catch (error) {
      console.error(error);
      alert('Error al registrar administración');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Cargando...</div>;

  const selectClass = "block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-[#333333]";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide";

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors">
          <ChevronLeft className="h-8 w-8" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Administración de Leche</h1>
          <p className="text-base text-slate-600 mt-1">Registro de dosificación para paciente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl overflow-hidden border border-slate-200">
        <div className="p-8 space-y-8">
          
          {/* Recipient Selection */}
          <div>
            <label className={labelClass}>Receptor (Paciente)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-6 w-6 text-slate-400" />
                </div>
                <select
                    name="recipientId"
                    className={`${selectClass} pl-12`}
                    value={formData.recipientId}
                    onChange={handleChange}
                    required
                >
                    <option value="">Seleccione un paciente...</option>
                    {recipients.map(r => (
                        <option key={r.id} value={r.id}>{r.fullName} ({r.hospitalService})</option>
                    ))}
                </select>
            </div>
          </div>

          {/* Batch Selection */}
          <div>
            <label className={labelClass}>Lote de Origen (Aprobados y Vigentes)</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Milk className="h-6 w-6 text-slate-400" />
                </div>
                <select
                    name="batchId"
                    className={`${selectClass} pl-12`}
                    value={formData.batchId}
                    onChange={handleChange}
                    required
                >
                    <option value="">Seleccione un lote disponible...</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id}>
                            {b.batchNumber} - Disp: {b.currentVolume}ml ({b.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'})
                        </option>
                    ))}
                </select>
            </div>
            {selectedBatch && (
                <div className="mt-3 text-base text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                     <p>Volumen Disponible: <span className="font-extrabold text-slate-900">{selectedBatch.currentVolume} ml</span></p>
                     <p>Tipo: <span className="font-medium">{selectedBatch.type === 'HOMOLOGOUS' ? 'Homólogo' : 'Heterólogo'}</span></p>
                     {selectedBatch.expirationDate && (
                         <p>Vence: <span className="font-medium">{selectedBatch.expirationDate}</span></p>
                     )}
                </div>
            )}
          </div>

          {/* Volume Input */}
          <div>
            <Input
                label="Volumen a Administrar (ml)"
                name="volume"
                type="number"
                min="1"
                max={selectedBatch?.currentVolume || 1000}
                value={formData.volume}
                onChange={handleChange}
                required
                placeholder="Ej. 30"
            />
            {Number(formData.volume) > (selectedBatch?.currentVolume || 0) && (
                <p className="text-sm text-red-600 flex items-center mt-2 font-bold bg-red-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4 mr-2" /> Excede volumen disponible
                </p>
            )}
          </div>

          {/* Notes */}
          <div>
              <label htmlFor="notes" className={labelClass}>
                Observaciones / Incidencias
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="block w-full px-4 py-3 border border-[#C6C6C6] bg-[#F2F4F7] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-[#333333]"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Ej. Tolerancia adecuada..."
              />
          </div>

        </div>

        <div className="px-8 py-6 bg-slate-50 text-right flex justify-end gap-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="w-32">
            Cancelar
          </Button>
          <Button 
            type="submit" 
            isLoading={submitting} 
            className="w-64 bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-200"
            disabled={!selectedBatch || Number(formData.volume) > selectedBatch.currentVolume}
          >
            <Syringe className="h-5 w-5 mr-2" />
            Registrar Administración
          </Button>
        </div>
      </form>
    </div>
  );
};
