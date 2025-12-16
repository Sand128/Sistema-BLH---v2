
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Baby, Stethoscope } from 'lucide-react';
import { recipientService } from '../services/recipientService';
import { Recipient } from '../types';
import { Button } from '../components/ui/Button';

export const RecipientList: React.FC = () => {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filtered, setFiltered] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipients();
  }, []);

  useEffect(() => {
    const results = recipients.filter(r => 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hospitalService.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(results);
  }, [searchTerm, recipients]);

  const loadRecipients = async () => {
    setLoading(true);
    try {
      const data = await recipientService.getAll();
      setRecipients(data);
      setFiltered(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Receptores Neonatales</h1>
          <p className="mt-2 text-base text-slate-600">Gestión de pacientes y asignación de leche.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/recipients/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Receptor
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="relative rounded-lg shadow-sm max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="focus:ring-2 focus:ring-teal-500 focus:border-teal-500 block w-full pl-10 py-3 text-base border-[#C6C6C6] rounded-md bg-[#F2F4F7] placeholder-[#9A9A9A] text-[#333333]"
              placeholder="Buscar por nombre o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Paciente
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Ubicación
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Diagnóstico
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Médico
                </th>
                 <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Cargando receptores...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron receptores.
                  </td>
                </tr>
              ) : (
                filtered.map((recipient) => (
                  <tr key={recipient.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <Baby className="h-6 w-6 text-teal-700" />
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-bold text-slate-900">
                            {recipient.fullName}
                          </div>
                          <div className="text-sm text-slate-500 font-medium">
                            {new Date(recipient.birthDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-700">
                        {recipient.hospitalService}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 max-w-xs truncate font-medium" title={recipient.diagnosis}>
                      {recipient.diagnosis}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" /> {recipient.doctorName}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            recipient.status === 'ACTIVE' ? 'bg-green-100 text-green-900 border border-green-200' : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                            {recipient.status === 'ACTIVE' ? 'Activo' : 'Alta'}
                        </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/recipients/${recipient.id}`} className="text-teal-600 hover:text-teal-800 font-bold flex items-center justify-end gap-1">
                        <Eye className="h-5 w-5" /> Detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
