
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Phone, MapPin } from 'lucide-react';
import { donorService } from '../services/donorService';
import { Donor } from '../types';
import { Button } from '../components/ui/Button';

export const DonorList: React.FC = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDonors();
  }, []);

  useEffect(() => {
    const results = donors.filter(donor => 
      `${donor.firstName} ${donor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDonors(results);
  }, [searchTerm, donors]);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const data = await donorService.getAll();
      const sorted = data.sort((a, b) => 
        new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
      );
      setDonors(sorted);
      setFilteredDonors(sorted);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-900 border border-green-200',
      INACTIVE: 'bg-red-100 text-red-900 border border-red-200',
      SCREENING: 'bg-yellow-100 text-yellow-900 border border-yellow-200',
      SUSPENDED: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    
    const labels: Record<string, string> = {
      ACTIVE: 'Activa',
      INACTIVE: 'Inactiva',
      SCREENING: 'En Estudio',
      SUSPENDED: 'Suspendida'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${styles[status] || styles.SUSPENDED}`}>
        {labels[status] || status}
      </span>
    );
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Directorio de Donadoras</h1>
          <p className="mt-2 text-base text-slate-600">Gestión de expedientes de madres donantes.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link to="/donors/new">
            <Button>
              <Plus className="h-5 w-5 mr-2" />
              Registrar Donadora
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
              className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 py-3 text-base border-[#C6C6C6] rounded-md bg-[#F2F4F7] placeholder-[#9A9A9A] text-[#333333]"
              placeholder="Buscar por nombre o correo..."
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
                  Donadora
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Contacto
                </th>
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Registro
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Cargando datos...
                  </td>
                </tr>
              ) : filteredDonors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron donadoras.
                  </td>
                </tr>
              ) : (
                filteredDonors.map((donor) => (
                  <tr key={donor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                            {donor.firstName[0]}{donor.lastName[0]}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-base font-bold text-slate-900">
                            {donor.firstName} {donor.lastName}
                          </div>
                          <div className="text-sm text-slate-600 font-medium">
                            {calculateAge(donor.birthDate)} años • {donor.bloodType || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <StatusBadge status={donor.status} />
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-sm text-slate-900 font-medium flex items-center gap-2 mb-1">
                         <Phone className="h-4 w-4 text-slate-400"/> {donor.phone}
                      </div>
                      <div className="text-sm text-slate-600 flex items-center gap-2 truncate max-w-xs" title={donor.address}>
                         <MapPin className="h-4 w-4 text-slate-400"/> {donor.address}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-slate-700">
                      {new Date(donor.registrationDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/donors/${donor.id}`} className="text-primary-600 hover:text-primary-800 font-bold flex items-center justify-end gap-1">
                        <Eye className="h-5 w-5" /> Ver
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
