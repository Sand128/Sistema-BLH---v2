
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Baby, Stethoscope, MapPin, Calendar, Activity, ExternalLink } from 'lucide-react';
import { recipientService } from '../services/recipientService';
import { Recipient, AdministrationRecord } from '../types';
import { Button } from '../components/ui/Button';

export const RecipientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [history, setHistory] = useState<AdministrationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (recipientId: string) => {
    try {
      const data = await recipientService.getById(recipientId);
      setRecipient(data || null);
      const hist = await recipientService.getHistory(recipientId);
      setHistory(hist.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando expediente...</div>;
  if (!recipient) return <div className="p-8 text-center text-red-500">Receptor no encontrado</div>;

  const totalVolume = history.reduce((sum, item) => sum + item.volumeAdministered, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/recipients')} className="text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{recipient.fullName}</h1>
        </div>
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/administration', { state: { recipientId: recipient.id } })}>
                Administrar Leche
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
             <div className="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:px-6 bg-teal-50 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-teal-900 flex items-center">
                        <Baby className="h-5 w-5 mr-2" /> Datos del Paciente
                    </h3>
                </div>
                <div className="px-4 py-5 sm:p-6 space-y-4">
                    <div>
                        <span className="text-sm font-medium text-gray-500 block">Diagnóstico</span>
                        <span className="text-sm text-gray-900">{recipient.diagnosis}</span>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500 block">Servicio</span>
                        <div className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{recipient.hospitalService}</span>
                        </div>
                    </div>
                    <div>
                        <span className="text-sm font-medium text-gray-500 block">Médico Tratante</span>
                        <div className="flex items-center mt-1">
                            <Stethoscope className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{recipient.doctorName}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm font-medium text-gray-500 block">Nacimiento</span>
                            <span className="text-sm text-gray-900">{new Date(recipient.birthDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-gray-500 block">Peso</span>
                            <span className="text-sm text-gray-900">{recipient.weightGrams}g</span>
                        </div>
                    </div>
                </div>
             </div>
             
             <div className="bg-white shadow rounded-lg p-6 border border-gray-200 text-center">
                 <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Administrado</h4>
                 <p className="mt-2 text-3xl font-bold text-teal-600">{totalVolume} ml</p>
             </div>
        </div>

        {/* Administration History */}
        <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                        <Activity className="h-5 w-5 mr-2 text-gray-500" />
                        Historial de Administraciones
                    </h3>
                </div>
                {history.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No hay registros de administración para este paciente.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volumen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote Origen</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {history.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(record.date).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-teal-700">
                                            {record.volumeAdministered} ml
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <Link to={`/batches/${record.batchId}`} className="text-teal-600 hover:text-teal-900 hover:underline flex items-center gap-1">
                                                {record.batchNumber}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.administeredBy}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
