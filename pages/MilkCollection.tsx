
import React, { useState, useEffect } from 'react';
import { 
    ThermometerSnowflake, Search, User, Calendar, FlaskConical, 
    Save, Building2, UserCircle2, Clock, Info, CheckCircle, List,
    AlertTriangle, Ban, Droplets
} from 'lucide-react';
import { donorService } from '../services/donorService';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { HOSPITALS } from '../services/hospitalData';
import { Donor, Bottle, MilkType } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type CollectionMode = 'EXTERNAL' | 'LACTARIUM';

export const MilkCollection: React.FC = () => {
    const currentUser = authService.getCurrentUser();
    
    // States
    const [mode, setMode] = useState<CollectionMode>('EXTERNAL');
    const [searchTerm, setSearchTerm] = useState('');
    const [donors, setDonors] = useState<Donor[]>([]);
    const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
    const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
    const [recentBottles, setRecentBottles] = useState<Bottle[]>([]);
    
    // Form State
    const [form, setForm] = useState({
        hospitalInitials: '', 
        volume: '',
        milkType: '' as MilkType | '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
        responsibleName: currentUser?.name || '',
        observations: '',
        obstetricEventType: 'PARTO' as 'PARTO' | 'CESAREA'
    });
    
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const results = donors.filter(d => 
                `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.folio?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredDonors(results);
        } else {
            setFilteredDonors([]);
        }
    }, [searchTerm, donors]);

    const loadData = async () => {
        const dData = await donorService.getAll();
        const bData = await batchService.getAvailableBottles();
        setDonors(dData);
        
        const today = new Date().toISOString().split('T')[0];
        setRecentBottles(bData.filter(b => b.collectionDate === today));
    };

    const handleSelectDonor = (donor: Donor) => {
        setSelectedDonor(donor);
        setSearchTerm('');
        setFilteredDonors([]);
        setForm(prev => ({
            ...prev,
            obstetricEventType: donor.cesareans > 0 && donor.deliveries === 0 ? 'CESAREA' : 'PARTO'
        }));
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

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            ACTIVE: 'Activa',
            INACTIVE: 'Inactiva',
            SCREENING: 'En Estudio',
            REJECTED: 'No Apta',
            SUSPENDED: 'Suspendida'
        };
        return labels[status] || status;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDonor) return;

        if (selectedDonor.status !== 'ACTIVE') {
            alert('Error de Seguridad: No se puede registrar leche de una donadora que no esté en estado ACTIVA.');
            return;
        }

        if (form.milkType === '') {
            alert('Debe seleccionar el Tipo de Leche recolectada.');
            return;
        }

        if (form.hospitalInitials === '') {
            alert('Debe seleccionar el Hospital o Unidad de origen del frasco.');
            return;
        }

        setLoading(true);
        try {
            const dateTime = `${form.date}T${form.time}:00`;
            const volumeVal = Number(form.volume);
            if (volumeVal <= 0) {
                alert('El volumen debe ser mayor a 0');
                setLoading(false);
                return;
            }

            await batchService.createBottle(
                selectedDonor.id,
                `${selectedDonor.firstName} ${selectedDonor.lastName}`,
                volumeVal,
                form.date,
                form.hospitalInitials,
                selectedDonor.donationType,
                form.milkType as MilkType,
                {
                    collectionDateTime: dateTime,
                    donorAge: calculateAge(selectedDonor.birthDate),
                    obstetricEventType: form.obstetricEventType,
                    gestationalAge: selectedDonor.gestationalAgeWeeks,
                    responsibleName: form.responsibleName,
                    observations: form.observations
                }
            );

            const updatedBottles = await batchService.getAvailableBottles();
            const today = new Date().toISOString().split('T')[0];
            setRecentBottles(updatedBottles.filter(b => b.collectionDate === today));
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            
            setForm(prev => ({ ...prev, volume: '', observations: '', milkType: '' }));

        } catch (error) {
            console.error(error);
            alert('Error al registrar el frasco.');
        } finally {
            setLoading(false);
        }
    };

    const isDonorRestricted = selectedDonor && selectedDonor.status !== 'ACTIVE';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <ThermometerSnowflake className="h-8 w-8 text-blue-500" />
                        Registro de Recolección
                    </h1>
                    <p className="mt-2 text-base text-slate-600">Entrada de leche al banco (Externa o Lactario).</p>
                </div>
                
                <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                    <button 
                        onClick={() => setMode('EXTERNAL')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            mode === 'EXTERNAL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Donadora Externa
                    </button>
                    <button 
                         onClick={() => setMode('LACTARIUM')}
                         className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                            mode === 'LACTARIUM' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        Lactario Hospitalario
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Identificar Donadora */}
                    <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 relative">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <UserCircle2 className="h-4 w-4" /> 1. Identificar Donadora
                        </h3>
                        
                        {!selectedDonor ? (
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Buscar por nombre o folio..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                {filteredDonors.length > 0 && (
                                    <div className="absolute z-50 w-full bg-white mt-1 border border-slate-200 rounded-md shadow-xl max-h-80 overflow-y-auto">
                                        {filteredDonors.map(donor => (
                                            <div 
                                                key={donor.id}
                                                className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                                                onClick={() => handleSelectDonor(donor)}
                                            >
                                                <div>
                                                    <p className="font-bold text-slate-800">{donor.firstName} {donor.lastName}</p>
                                                    <p className="text-xs text-slate-500">Folio: {donor.folio} • {calculateAge(donor.birthDate)} años</p>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                                                    donor.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    donor.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                    {getStatusLabel(donor.status)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={`rounded-lg p-4 flex justify-between items-center border ${
                                isDonorRestricted ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'
                            }`}>
                                <div>
                                    <p className="text-lg font-bold text-slate-900">{selectedDonor.firstName} {selectedDonor.lastName}</p>
                                    <div className="text-sm text-slate-600 flex flex-wrap gap-4 mt-1">
                                        <span>Folio: <strong>{selectedDonor.folio}</strong></span>
                                        <span className={`font-black uppercase flex items-center gap-1 ${isDonorRestricted ? 'text-amber-700' : 'text-emerald-700'}`}>
                                            Estatus: {getStatusLabel(selectedDonor.status)}
                                            {isDonorRestricted && <AlertTriangle className="h-3 w-3" />}
                                        </span>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setSelectedDonor(null)} className="text-xs h-8">
                                    Cambiar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Alerta de Restricción */}
                    {isDonorRestricted && (
                        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl animate-in fade-in zoom-in duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-red-100 rounded-full text-red-600">
                                    <Ban className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-black text-red-800 uppercase tracking-tight">Donadora No Apta para Recolección</h4>
                                    <p className="text-red-700 mt-1 leading-relaxed">
                                        El sistema no permite el ingreso de leche de donadoras con estatus <strong>{getStatusLabel(selectedDonor.status)}</strong>. 
                                        Para habilitar el registro, verifique los exámenes pendientes en el expediente clínico y actualice el estatus a <strong>ACTIVA</strong>.
                                    </p>
                                    <div className="mt-4">
                                        <Button 
                                            variant="outline" 
                                            className="border-red-200 text-red-800 hover:bg-red-100 text-xs py-2"
                                            onClick={() => window.open(`#/donors/${selectedDonor.id}`, '_blank')}
                                        >
                                            Ver expediente clínico
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Registration Form */}
                    <div className={`bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden transition-all duration-500 ${(!selectedDonor || isDonorRestricted) ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-blue-600" />
                                2. Detalles del Frasco
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={mode === 'LACTARIUM' ? 'bg-blue-50/30 p-3 rounded-lg border border-blue-100' : ''}>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        <Building2 className="inline-block h-4 w-4 mr-1 mb-0.5" />
                                        Unidad Médica (Origen) <span className="text-red-600">*</span>
                                    </label>
                                    <select 
                                        className={`block w-full px-4 py-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${form.hospitalInitials === '' ? 'border-amber-300' : 'border-slate-300'}`}
                                        value={form.hospitalInitials}
                                        onChange={e => setForm({...form, hospitalInitials: e.target.value})}
                                        required
                                    >
                                        <option value="">Seleccione una unidad médica...</option>
                                        {HOSPITALS.map(h => (
                                            <option key={h.initials} value={h.initials}>{h.name} ({h.initials})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-pink-50/30 p-3 rounded-lg border border-pink-100">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        <Droplets className="inline-block h-4 w-4 mr-1 mb-0.5 text-pink-600" />
                                        Tipo de Leche <span className="text-red-600">*</span>
                                    </label>
                                    <select 
                                        className={`block w-full px-4 py-3 border rounded-md focus:ring-pink-500 focus:border-pink-500 font-bold ${form.milkType === '' ? 'border-amber-300' : 'border-slate-300'}`}
                                        value={form.milkType}
                                        onChange={e => setForm({...form, milkType: e.target.value as MilkType})}
                                        required
                                    >
                                        <option value="">-- Seleccione tipo --</option>
                                        <option value="PRECALOSTRO">Precalostro</option>
                                        <option value="CALOSTRO">Calostro</option>
                                        <option value="TRANSICION">Transición</option>
                                        <option value="MADURA">Madura</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Tipo de Evento Obstétrico</label>
                                    <select 
                                        className="block w-full px-4 py-3 border border-slate-300 rounded-md bg-slate-50"
                                        value={form.obstetricEventType}
                                        onChange={e => setForm({...form, obstetricEventType: e.target.value as any})}
                                    >
                                        <option value="PARTO">Parto Eutócico</option>
                                        <option value="CESAREA">Cesárea</option>
                                    </select>
                                </div>
                                
                                <div>
                                    <Input
                                        label="Volumen Extraído (ml)"
                                        type="number"
                                        placeholder="Ej. 150"
                                        value={form.volume}
                                        onChange={e => setForm({...form, volume: e.target.value})}
                                        required
                                        min="1"
                                        className="bg-white text-lg font-bold text-blue-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Fecha Extracción</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input 
                                            type="date"
                                            className="block w-full pl-10 px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500"
                                            value={form.date}
                                            onChange={e => setForm({...form, date: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Hora</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                                        <input 
                                            type="time"
                                            className="block w-full pl-10 px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500"
                                            value={form.time}
                                            onChange={e => setForm({...form, time: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Input 
                                    label="Responsable de Recolección"
                                    value={form.responsibleName}
                                    onChange={e => setForm({...form, responsibleName: e.target.value})}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Observaciones</label>
                                <textarea 
                                    className="block w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 text-sm"
                                    rows={2}
                                    placeholder="Incidencias, estado del frasco, etc."
                                    value={form.observations}
                                    onChange={e => setForm({...form, observations: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="text-sm text-slate-500 italic flex items-center">
                                    <Info className="h-4 w-4 mr-1" />
                                    Se generará un código de trazabilidad único.
                                </div>
                                <Button 
                                    type="submit" 
                                    isLoading={loading} 
                                    disabled={isDonorRestricted}
                                    className="w-48 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                                >
                                    <Save className="h-5 w-5 mr-2" />
                                    Registrar Frasco
                                </Button>
                            </div>
                        </form>
                    </div>

                    {saveSuccess && (
                        <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Frasco registrado correctamente. Puede continuar con el siguiente.
                        </div>
                    )}
                </div>

                {/* Right Column: Daily Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-sm rounded-xl border border-slate-200 flex flex-col h-full max-h-[calc(100vh-120px)] sticky top-6">
                        <div className="p-4 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                                <List className="h-4 w-4" /> Resumen del Día
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {recentBottles.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">No hay recolecciones hoy.</p>
                            ) : (
                                recentBottles.slice().reverse().map(bottle => (
                                    <div key={bottle.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-blue-200 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                {bottle.traceabilityCode.split('-')[0]}
                                            </span>
                                            <span className="text-xs font-bold text-slate-900">{bottle.volume} ml</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-800 truncate">{bottle.donorName}</p>
                                        <p className="text-[10px] font-black text-pink-600 uppercase mt-1">{bottle.milkType}</p>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-[10px] text-slate-500 uppercase">{bottle.hospitalInitials}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {bottle.collectionDateTime ? new Date(bottle.collectionDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Total Hoy</span>
                                <span className="text-lg font-extrabold text-blue-600">
                                    {(recentBottles.reduce((acc, b) => acc + b.volume, 0) / 1000).toFixed(2)} L
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
