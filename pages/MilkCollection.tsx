
import React, { useState, useEffect } from 'react';
import { 
    ThermometerSnowflake, Search, User, Calendar, FlaskConical, 
    Save, Building2, UserCircle2, Clock, Info, CheckCircle, List
} from 'lucide-react';
import { donorService } from '../services/donorService';
import { batchService } from '../services/batchService';
import { authService } from '../services/authService';
import { HOSPITALS } from '../services/hospitalData';
import { Donor, Bottle } from '../types';
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
        hospitalInitials: 'HMPMPS', // Default to main hospital
        volume: '',
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
        if (searchTerm.length > 2) {
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
        const bData = await batchService.getAvailableBottles(); // Only need bottles for today really, but this works
        setDonors(dData.filter(d => d.status === 'ACTIVE'));
        
        // Filter bottles collected today for the summary
        const today = new Date().toISOString().split('T')[0];
        setRecentBottles(bData.filter(b => b.collectionDate === today));
    };

    const handleSelectDonor = (donor: Donor) => {
        setSelectedDonor(donor);
        setSearchTerm('');
        setFilteredDonors([]);
        // Auto-fill some derived data if possible
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDonor) return;

        setLoading(true);
        try {
            // Combine date and time for ISO string
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
                {
                    collectionDateTime: dateTime,
                    donorAge: calculateAge(selectedDonor.birthDate),
                    obstetricEventType: form.obstetricEventType,
                    gestationalAge: selectedDonor.gestationalAgeWeeks, // Snapshot from donor record
                    responsibleName: form.responsibleName,
                    observations: form.observations
                }
            );

            // Refresh recent bottles list
            const updatedBottles = await batchService.getAvailableBottles();
            const today = new Date().toISOString().split('T')[0];
            setRecentBottles(updatedBottles.filter(b => b.collectionDate === today));
            
            // Success Feedback
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            // Reset only volume and obs, keep donor selected for multi-bottle entry
            setForm(prev => ({ ...prev, volume: '', observations: '' }));

        } catch (error) {
            console.error(error);
            alert('Error al registrar el frasco.');
        } finally {
            setLoading(false);
        }
    };

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
                
                {/* Mode Switcher */}
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
                
                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Donor Selection */}
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
                                    <div className="absolute z-10 w-full bg-white mt-1 border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredDonors.map(donor => (
                                            <div 
                                                key={donor.id}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0"
                                                onClick={() => handleSelectDonor(donor)}
                                            >
                                                <p className="font-bold text-slate-800">{donor.firstName} {donor.lastName}</p>
                                                <p className="text-xs text-slate-500">Folio: {donor.folio} • {calculateAge(donor.birthDate)} años</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex justify-between items-center">
                                <div>
                                    <p className="text-lg font-bold text-slate-900">{selectedDonor.firstName} {selectedDonor.lastName}</p>
                                    <div className="text-sm text-slate-600 flex gap-4 mt-1">
                                        <span>Edad: <strong>{calculateAge(selectedDonor.birthDate)} años</strong></span>
                                        <span>Edad Gestacional: <strong>{selectedDonor.gestationalAgeWeeks} sem</strong></span>
                                        <span>Folio: <strong>{selectedDonor.folio}</strong></span>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setSelectedDonor(null)} className="text-xs h-8">
                                    Cambiar
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Registration Form */}
                    <div className={`bg-white shadow-md rounded-xl border border-slate-200 overflow-hidden transition-opacity ${!selectedDonor ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <FlaskConical className="h-5 w-5 text-blue-600" />
                                2. Detalles del Frasco
                            </h3>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            
                            {/* Hospital Selection (Important for Lactarium) */}
                            <div className={mode === 'LACTARIUM' ? 'bg-blue-50/50 p-4 rounded-lg border border-blue-100' : ''}>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    <Building2 className="inline-block h-4 w-4 mr-1 mb-0.5" />
                                    Centro de Recolección / Hospital
                                </label>
                                <select 
                                    className="block w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={form.hospitalInitials}
                                    onChange={e => setForm({...form, hospitalInitials: e.target.value})}
                                >
                                    {HOSPITALS.map(h => (
                                        <option key={h.initials} value={h.initials}>{h.name} ({h.initials})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Auto-filled / Editable Clinical Data */}
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
                                
                                {/* Volume */}
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

                                {/* Date & Time */}
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
                                    Se generará lote único automáticamente.
                                </div>
                                <Button 
                                    type="submit" 
                                    isLoading={loading} 
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
