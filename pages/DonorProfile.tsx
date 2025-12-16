
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, Edit, Phone, Mail, MapPin, Calendar, 
  FileText, Activity, Plus, FlaskConical, ExternalLink, 
  QrCode, User, HeartPulse, Stethoscope, AlertCircle,
  FileDown
} from 'lucide-react';
import { donorService } from '../services/donorService';
import { batchService } from '../services/batchService';
import { pdfService } from '../services/pdfService';
import { Donor, Bottle } from '../types';
import { HOSPITALS } from '../services/hospitalData';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

// Tipos para la navegación interna
type TabType = 'GENERAL' | 'CLINICAL' | 'CONTACT' | 'HISTORY';

export const DonorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [donor, setDonor] = useState<Donor | null>(null);
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('GENERAL');
  
  // PDF State
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // New Bottle Form State
  const [isAddingBottle, setIsAddingBottle] = useState(false);
  const [bottleForm, setBottleForm] = useState({
    volume: '',
    date: new Date().toISOString().split('T')[0],
    hospitalInitials: 'HMPMPS' // Default
  });
  const [addingLoading, setAddingLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadData(id);
    }
  }, [id]);

  const loadData = async (donorId: string) => {
    try {
        const donorData = await donorService.getById(donorId);
        setDonor(donorData || null);
        
        if (donorData) {
            const bottleData = await batchService.getBottlesByDonorId(donorId);
            setBottles(bottleData.sort((a,b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()));
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleDownloadConsent = async () => {
    if (!donor) return;
    setDownloadingPdf(true);
    try {
      const fullName = `${donor.firstName} ${donor.lastName}`;
      const pdfBytes = await pdfService.generateConsentPdf(fullName);
      const filename = `Consentimiento_${donor.firstName.replace(/\s+/g, '_')}_${donor.lastName.replace(/\s+/g, '_')}.pdf`;
      pdfService.downloadPdf(pdfBytes, filename);
    } catch (error) {
      console.error(error);
      alert('Error al generar el PDF. Por favor verifique la plantilla.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleAddBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donor) return;
    setAddingLoading(true);
    try {
        await batchService.createBottle(
            donor.id, 
            `${donor.firstName} ${donor.lastName}`,
            Number(bottleForm.volume),
            bottleForm.date,
            bottleForm.hospitalInitials,
            donor.donationType
        );
        // Refresh bottles
        const updatedBottles = await batchService.getBottlesByDonorId(donor.id);
        setBottles(updatedBottles.sort((a,b) => new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime()));
        setIsAddingBottle(false);
        setBottleForm({ 
            volume: '', 
            date: new Date().toISOString().split('T')[0],
            hospitalInitials: 'HMPMPS'
        });
    } catch (error) {
        alert('Error al registrar frasco');
    } finally {
        setAddingLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Cargando expediente digital...</div>;
  if (!donor) return <div className="p-12 text-center text-red-600 font-bold bg-red-50 rounded-lg mx-8 mt-8">Expediente de donadora no encontrado</div>;

  // Componentes Visuales Auxiliares
  const StatusBadge = ({ status }: { status: string }) => {
     const styles: Record<string, string> = {
       ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200 ring-emerald-500/20',
       INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200 ring-slate-500/20',
       SCREENING: 'bg-amber-100 text-amber-800 border-amber-200 ring-amber-500/20',
       REJECTED: 'bg-red-100 text-red-800 border-red-200 ring-red-500/20',
       SUSPENDED: 'bg-orange-100 text-orange-800 border-orange-200 ring-orange-500/20'
     };
     const labels: Record<string, string> = {
       ACTIVE: 'Activa',
       INACTIVE: 'Inactiva',
       SCREENING: 'En Estudio',
       REJECTED: 'No Apta',
       SUSPENDED: 'Suspendida'
     };

     return (
       <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ring-1 ring-inset ${styles[status] || styles.INACTIVE}`}>
         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-current opacity-60'}`}></span>
         {labels[status] || status}
       </span>
     );
  };

  const InfoItem = ({ label, value, icon: Icon, className = "" }: any) => (
    <div className={`p-4 rounded-xl bg-slate-50 border border-slate-100 ${className}`}>
        <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon className="h-4 w-4 text-slate-400" />}
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-base font-semibold text-slate-900 break-words">{value || <span className="text-slate-400 italic">No registrado</span>}</div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{title}</h3>
  );

  const TabButton = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-4 text-sm font-medium transition-all duration-200 border-l-4 ${
            activeTab === id 
            ? 'bg-pink-50 border-pink-500 text-pink-700' 
            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
          <Icon className={`h-5 w-5 ${activeTab === id ? 'text-pink-600' : 'text-slate-400'}`} />
          {label}
      </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
                <button onClick={() => navigate('/donors')} className="group p-2 rounded-full hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                    <ChevronLeft className="h-6 w-6 text-slate-400 group-hover:text-slate-600" />
                </button>
                
                <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-md">
                        <span className="text-3xl font-bold text-pink-600">{donor.firstName[0]}{donor.lastName[0]}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        {donor.bloodType && (
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                                {donor.bloodType}
                            </span>
                        )}
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                        {donor.firstName} {donor.lastName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <StatusBadge status={donor.status} />
                        <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                            Folio: {donor.folio || 'S/F'}
                        </span>
                        <span className="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                            Exp: {donor.fileNumber}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto mt-4 md:mt-0">
                <Button 
                    variant="outline" 
                    onClick={handleDownloadConsent} 
                    isLoading={downloadingPdf}
                    className="w-full md:w-auto border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                    <FileDown className="h-4 w-4 mr-2" />
                    Consentimiento
                </Button>

                {donor.status === 'ACTIVE' && (
                    <Button 
                        className="w-full md:w-auto bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200"
                        onClick={() => {
                            setActiveTab('HISTORY');
                            setIsAddingBottle(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nueva Donación
                    </Button>
                )}
            </div>
        </div>
        
        {/* Rejection Alert */}
        {donor.status === 'REJECTED' && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                    <h4 className="text-sm font-bold text-red-800">Causa de Rechazo / No Aptitud</h4>
                    <p className="text-sm text-red-700 mt-1">{donor.rejectionReason}</p>
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menú del Perfil</h2>
              </div>
              <nav className="flex flex-col">
                  <TabButton id="GENERAL" label="Datos Generales" icon={User} />
                  <TabButton id="CLINICAL" label="Información Clínica" icon={Stethoscope} />
                  <TabButton id="CONTACT" label="Contacto y Ubicación" icon={MapPin} />
                  <TabButton id="HISTORY" label="Historial Donaciones" icon={FlaskConical} />
              </nav>
              
              {/* Stats Mini Widget */}
              <div className="p-5 border-t border-slate-200 mt-2">
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase">Total Donado</p>
                  <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900">
                          {(bottles.reduce((acc, b) => acc + b.volume, 0) / 1000).toFixed(1)}
                      </span>
                      <span className="text-sm text-slate-600 font-medium">Litros</span>
                  </div>
              </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-6">
              
              {/* TAB: GENERAL */}
              {activeTab === 'GENERAL' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <SectionTitle title="Información Personal" />
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <InfoItem label="Fecha de Nacimiento" value={new Date(donor.birthDate).toLocaleDateString()} icon={Calendar} />
                          <InfoItem label="Edad" value={`${new Date().getFullYear() - new Date(donor.birthDate).getFullYear()} años`} />
                          <InfoItem label="Ocupación" value={donor.occupation} />
                          <InfoItem label="Religión" value={donor.religion} />
                          <InfoItem label="Fecha Registro" value={new Date(donor.registrationDate).toLocaleDateString()} />
                          <InfoItem label="Clasificación" value={donor.donorCategory === 'EXTERNAL' ? 'Externa' : donor.donorCategory} />
                      </div>

                      <div className="mt-8">
                          <SectionTitle title="Tipo de Donación" />
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center gap-4">
                              <div className="p-3 bg-white rounded-full shadow-sm">
                                  <HeartPulse className="h-6 w-6 text-blue-500" />
                              </div>
                              <div>
                                  <p className="text-sm font-bold text-slate-900">
                                      {donor.donationType === 'HOMOLOGOUS' ? 'Homóloga (Directa)' : 
                                       donor.donationType === 'HETEROLOGOUS' ? 'Heteróloga (Banco)' : 
                                       donor.donationType === 'MIXED' ? 'Mixta' : 'Rechazada'}
                                  </p>
                                  <p className="text-xs text-slate-600 mt-1">
                                      Motivo: {donor.donationReason === 'SURPLUS' ? 'Excedente de Producción' : 
                                               donor.donationReason === 'DEATH' ? 'Duelo (Muerte Neonatal)' : 'Otro'}
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: CLINICAL */}
              {activeTab === 'CLINICAL' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <SectionTitle title="Antecedentes Perinatales" />
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                          <InfoItem label="Fecha Parto" value={new Date(donor.deliveryDate).toLocaleDateString()} icon={Calendar} />
                          <InfoItem label="Edad Gestacional" value={`${donor.gestationalAgeWeeks} semanas`} />
                          <InfoItem label="Semanas Lactancia" value={donor.infantAgeWeeks} />
                          <InfoItem label="Control Prenatal" value={donor.prenatalControlEntity} />
                          <InfoItem label="Peso Actual" value={`${donor.weightCurrent} kg`} />
                          <InfoItem label="Talla" value={`${donor.height} cm`} />
                          <InfoItem label="IMC" value={donor.bmi} className={donor.bmi < 18.5 || donor.bmi > 30 ? 'bg-amber-50 border-amber-100' : ''} />
                      </div>

                      <SectionTitle title="Historia Gineco-Obstétrica" />
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 text-center">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="block text-xs font-bold text-slate-400 uppercase">Gestas</span>
                              <span className="text-xl font-extrabold text-slate-800">{donor.gestations}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="block text-xs font-bold text-slate-400 uppercase">Partos</span>
                              <span className="text-xl font-extrabold text-slate-800">{donor.deliveries}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="block text-xs font-bold text-slate-400 uppercase">Cesáreas</span>
                              <span className="text-xl font-extrabold text-slate-800">{donor.cesareans}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="block text-xs font-bold text-slate-400 uppercase">Abortos</span>
                              <span className="text-xl font-extrabold text-slate-800">{donor.abortions}</span>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 col-span-2 md:col-span-1">
                              <span className="block text-xs font-bold text-slate-400 uppercase">Parejas</span>
                              <span className="text-xl font-extrabold text-slate-800">{donor.sexualPartners}</span>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <SectionTitle title="Patologías Reportadas" />
                              <ul className="space-y-2">
                                  {donor.pathologies?.filter(p => p.present).length === 0 ? (
                                      <li className="text-sm text-slate-500 italic">Niega antecedentes patológicos relevantes.</li>
                                  ) : (
                                      donor.pathologies?.filter(p => p.present).map((p, idx) => (
                                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-red-50 p-2 rounded border border-red-100">
                                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                              <span>{p.name} {p.specification ? `(${p.specification})` : ''} - {p.timeElapsed}</span>
                                          </li>
                                      ))
                                  )}
                              </ul>
                          </div>
                          <div>
                              <SectionTitle title="Tratamiento Farmacológico" />
                              <ul className="space-y-2">
                                  {!donor.isTakingMedication || donor.medicationsList?.length === 0 ? (
                                      <li className="text-sm text-slate-500 italic">No consume medicamentos actualmente.</li>
                                  ) : (
                                      donor.medicationsList?.filter(m => m.name).map((m, idx) => (
                                          <li key={idx} className="text-sm text-slate-700 bg-amber-50 p-2 rounded border border-amber-100">
                                              <strong>{m.name} {m.dosage}</strong>
                                              <br/>
                                              <span className="text-xs text-slate-500">Motivo: {m.reason}</span>
                                          </li>
                                      ))
                                  )}
                              </ul>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: CONTACT */}
              {activeTab === 'CONTACT' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <SectionTitle title="Información de Contacto" />
                      <div className="space-y-4">
                          <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/50 transition-colors">
                              <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                                  <Phone className="h-6 w-6 text-blue-500" />
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Teléfono</p>
                                  <p className="text-lg font-bold text-slate-900">{donor.phone}</p>
                              </div>
                          </div>
                          
                          <div className="flex items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/50 transition-colors">
                              <div className="bg-white p-3 rounded-full shadow-sm mr-4">
                                  <Mail className="h-6 w-6 text-pink-500" />
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Correo Electrónico</p>
                                  <p className="text-lg font-bold text-slate-900 break-all">{donor.email}</p>
                              </div>
                          </div>

                          <div className="flex items-start p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50/50 transition-colors">
                              <div className="bg-white p-3 rounded-full shadow-sm mr-4 mt-1">
                                  <MapPin className="h-6 w-6 text-emerald-500" />
                              </div>
                              <div>
                                  <p className="text-xs font-bold text-slate-400 uppercase">Dirección Domiciliaria</p>
                                  <p className="text-lg font-medium text-slate-900">{donor.address}</p>
                                  {donor.addressReferences && (
                                      <p className="text-sm text-slate-500 mt-2 bg-white/50 p-2 rounded border border-slate-200">
                                          <span className="font-bold">Ref:</span> {donor.addressReferences}
                                      </p>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* TAB: HISTORY (Bottles) */}
              {activeTab === 'HISTORY' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                      
                      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                          <div>
                              <h3 className="text-lg font-bold text-slate-900">Historial de Recolección</h3>
                              <p className="text-sm text-slate-500">{bottles.length} frascos registrados</p>
                          </div>
                          {!isAddingBottle && donor.status === 'ACTIVE' && (
                              <Button 
                                onClick={() => setIsAddingBottle(true)}
                                className="bg-pink-600 hover:bg-pink-700 shadow-md"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Registrar Frasco
                              </Button>
                          )}
                      </div>

                      {/* Add Bottle Form Panel */}
                      {isAddingBottle && (
                          <div className="p-6 bg-pink-50/50 border-b border-pink-100 animate-in slide-in-from-top-2">
                              <h4 className="text-sm font-bold text-pink-800 uppercase mb-4">Nueva Etiqueta de Recolección</h4>
                              <form onSubmit={handleAddBottle} className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Hospital de Origen</label>
                                          <select 
                                            className="block w-full px-4 py-3 border border-[#C6C6C6] bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm text-[#333333]"
                                            value={bottleForm.hospitalInitials}
                                            onChange={(e) => setBottleForm({...bottleForm, hospitalInitials: e.target.value})}
                                          >
                                              {HOSPITALS.map(h => (
                                                  <option key={h.initials} value={h.initials}>{h.name} ({h.initials})</option>
                                              ))}
                                          </select>
                                      </div>
                                      <Input 
                                        label="Fecha Recolección"
                                        type="date" 
                                        required 
                                        value={bottleForm.date}
                                        onChange={(e) => setBottleForm({...bottleForm, date: e.target.value})}
                                        className="bg-white"
                                      />
                                      <Input 
                                        label="Volumen (ml)"
                                        type="number" 
                                        min="10"
                                        required 
                                        value={bottleForm.volume}
                                        onChange={(e) => setBottleForm({...bottleForm, volume: e.target.value})}
                                        className="bg-white"
                                        placeholder="Ej. 150"
                                      />
                                  </div>
                                  <div className="flex justify-end gap-3 pt-2">
                                      <Button type="button" variant="outline" onClick={() => setIsAddingBottle(false)} className="w-32">
                                          Cancelar
                                      </Button>
                                      <Button type="submit" isLoading={addingLoading} className="w-48 bg-pink-600 hover:bg-pink-700">
                                          Generar Etiqueta
                                      </Button>
                                  </div>
                              </form>
                          </div>
                      )}

                      {/* List */}
                      <div className="max-h-[600px] overflow-y-auto">
                          {bottles.length === 0 ? (
                              <div className="p-12 text-center flex flex-col items-center">
                                  <FlaskConical className="h-12 w-12 text-slate-200 mb-3" />
                                  <p className="text-slate-500 font-medium">No hay donaciones registradas aún.</p>
                              </div>
                          ) : (
                              <ul className="divide-y divide-slate-100">
                                  {bottles.map(bottle => (
                                      <li key={bottle.id} className="px-6 py-4 hover:bg-slate-50 transition-colors group">
                                          <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-4">
                                                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                                      <QrCode className="h-6 w-6" />
                                                  </div>
                                                  <div>
                                                      <div className="flex items-center gap-2">
                                                          <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                              {bottle.traceabilityCode || 'S/C'}
                                                          </span>
                                                          <span className="text-xs text-slate-400">{bottle.hospitalInitials}</span>
                                                      </div>
                                                      <div className="flex items-center gap-2 mt-1">
                                                          <p className="text-sm text-slate-500 flex items-center">
                                                              <Calendar className="h-3 w-3 mr-1" />
                                                              {new Date(bottle.collectionDate).toLocaleDateString()}
                                                          </p>
                                                      </div>
                                                  </div>
                                              </div>
                                              
                                              <div className="text-right">
                                                  <p className="text-lg font-extrabold text-slate-900">{bottle.volume} ml</p>
                                                  <div className="mt-1">
                                                      {bottle.status === 'ASSIGNED' && bottle.batchId ? (
                                                          <Link 
                                                            to={`/batches/${bottle.batchId}`}
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:underline transition-colors"
                                                          >
                                                              Lote Asignado <ExternalLink className="h-3 w-3 ml-1" />
                                                          </Link>
                                                      ) : (
                                                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                              bottle.status === 'COLLECTED' ? 'bg-blue-100 text-blue-700' :
                                                              'bg-gray-100 text-gray-500'
                                                          }`}>
                                                              {bottle.status === 'COLLECTED' ? 'Disponible' : 'Descartado'}
                                                          </span>
                                                      )}
                                                  </div>
                                              </div>
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                          )}
                      </div>
                  </div>
              )}

          </div>
      </div>
    </div>
  );
};
