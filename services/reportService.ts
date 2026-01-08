
import { KPIMetrics, TrendPoint, QualityStats, Batch, Bottle } from '../types';
import { batchService } from './batchService';
import { donorService } from './donorService';
import { recipientService } from './recipientService';

export interface InadequateSampleRow {
  fecha: string;
  unidad: string;
  tipoDonadora: string;
  cantidad: number;
  motivo: string;
  estadoFinal: string;
  observaciones: string;
  volumen: number;
}

export interface MonthlyFrequencyRow {
  unidad_medica: string;
  mes_anio: string;
  num_rechazos_acidez: number;
  num_rechazos_envase: number;
  num_rechazos_suciedad: number;
  num_rechazos_color_flavor: number;
  porcentaje_acidez: number;
  porcentaje_envase: number;
  porcentaje_suciedad: number;
  porcentaje_color_flavor: number;
  total_muestras_inadecuadas: number;
  total_muestras_analizadas: number;
  responsable: string;
}

export const reportService = {
  getKPIMetrics: async (): Promise<KPIMetrics> => {
    const donors = await donorService.getAll();
    const batches = await batchService.getAll();
    const activeDonorsCount = donors.filter(d => d.status === 'ACTIVE').length;
    const concludedBatches = batches.filter(b => b.status === 'APPROVED' || b.status === 'REJECTED');
    const approvedBatches = concludedBatches.filter(b => b.status === 'APPROVED').length;
    const qualityApprovalRate = concludedBatches.length > 0 
      ? Math.round((approvedBatches / concludedBatches.length) * 100) 
      : 100;
    return { activeDonorsCount, qualityApprovalRate, avgProcessingTimeHours: 48, wasteRate: 2.5 };
  },

  getVolumeTrends: async (months = 6): Promise<TrendPoint[]> => {
    const batches = await batchService.getAll();
    const today = new Date();
    const trends: TrendPoint[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const monthBatches = batches.filter(b => b.creationDate.startsWith(key));
      const collected = monthBatches.reduce((sum, b) => sum + b.totalVolume, 0);
      const adminVolume = Math.round(collected * (0.8 + Math.random() * 0.15));
      trends.push({ date: key, collectedVolume: collected, administeredVolume: adminVolume });
    }
    return trends;
  },

  /**
   * Genera los datos agregados para la tabla de Frecuencia Mensual de Muestras Inadecuadas
   * Consolidación automática desde el módulo de Análisis.
   */
  getMonthlyFrequencyTable: async (startDate: string, endDate: string): Promise<MonthlyFrequencyRow[]> => {
    const batches = await batchService.getAll();
    
    // Filtrar lotes que han pasado por análisis (Aprobados o Rechazados)
    const analyzedBatches = batches.filter(b => 
      b.creationDate >= startDate && 
      b.creationDate <= endDate && 
      ['APPROVED', 'REJECTED', 'PENDING_QC'].includes(b.status)
    );

    const groups: Record<string, Batch[]> = {};
    for (const b of analyzedBatches) {
      const date = new Date(b.creationDate);
      const monthKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
      const unit = "HMPMPS"; // Valor institucional por defecto
      const groupKey = `${unit}-${monthKey}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(b);
    }

    const tableData: MonthlyFrequencyRow[] = await Promise.all(Object.entries(groups).map(async ([key, groupBatches]) => {
      const [unit, monthYear] = key.split('-');
      
      const totalAnalizadas = groupBatches.reduce((acc, b) => acc + b.bottleCount, 0);
      let acidez = 0, envase = 0, suciedad = 0, colorFlavor = 0;
      let resp = 'Dra. Elena Torres'; // Responsable por defecto

      for (const b of groupBatches) {
        if (b.status === 'REJECTED') {
          const qc = await batchService.getQCRecord(b.id);
          const phys = await batchService.getPhysicalQCRecord(b.id);
          
          if (qc?.acidityDornic && qc.acidityDornic > 8) acidez += b.bottleCount;
          
          if (phys && (!phys.containerState.integrity || !phys.containerState.lid || !phys.containerState.seal)) {
            envase += b.bottleCount;
          }
          
          if (qc?.coliformsPresence || (phys && phys.rejectionReasons.some(r => r.toLowerCase().includes('suciedad') || r.toLowerCase().includes('contaminación')))) {
            suciedad += b.bottleCount;
          }
          
          if (qc?.flavor === 'OFF_FLAVOR' || (qc?.color && !qc.color.toLowerCase().includes('blanco'))) {
            colorFlavor += b.bottleCount;
          }
          
          if (qc?.inspectorName) resp = qc.inspectorName;
          else if (phys?.inspectorName) resp = phys.inspectorName;
        }
      }

      const totalInadecuadas = acidez + envase + suciedad + colorFlavor;

      return {
        unidad_medica: unit + " - Toluca",
        mes_anio: monthYear,
        num_rechazos_acidez: acidez,
        num_rechazos_envase: envase,
        num_rechazos_suciedad: suciedad,
        num_rechazos_color_flavor: colorFlavor,
        porcentaje_acidez: totalAnalizadas > 0 ? (acidez / totalAnalizadas) * 100 : 0,
        porcentaje_envase: totalAnalizadas > 0 ? (envase / totalAnalizadas) * 100 : 0,
        porcentaje_suciedad: totalAnalizadas > 0 ? (suciedad / totalAnalizadas) * 100 : 0,
        porcentaje_color_flavor: totalAnalizadas > 0 ? (colorFlavor / totalAnalizadas) * 100 : 0,
        total_muestras_inadecuadas: totalInadecuadas,
        total_muestras_analizadas: totalAnalizadas,
        responsable: resp
      };
    }));

    return tableData;
  },

  getInadequateSamplesData: async (startDate: string, endDate: string): Promise<{
    rows: InadequateSampleRow[],
    totalAnalizadas: number,
    totalInadecuadas: number,
    porcentajeRechazo: number,
    causaPrincipal: string
  }> => {
    const batches = await batchService.getAll();
    const donors = await donorService.getAll();
    
    const analyzedBatches = batches.filter(b => 
      b.creationDate >= startDate && 
      b.creationDate <= endDate && 
      ['APPROVED', 'REJECTED'].includes(b.status)
    );

    const inadequateBatches = analyzedBatches.filter(b => b.status === 'REJECTED');
    
    const rows: InadequateSampleRow[] = await Promise.all(inadequateBatches.map(async (b) => {
      const qc = await batchService.getQCRecord(b.id);
      const physical = await batchService.getPhysicalQCRecord(b.id);
      const bottlesInBatch = await batchService.getBottlesByBatchId(b.id);
      
      const firstBottleDonorId = bottlesInBatch[0]?.donorId;
      const donor = donors.find(d => d.id === firstBottleDonorId);

      let motivo = 'Otras';
      if (qc?.acidityDornic && qc.acidityDornic > 8) motivo = 'Acidez';
      else if (qc?.coliformsPresence) motivo = 'Suciedad (Coliformes)';
      else if (physical?.containerState && !physical.containerState.integrity) motivo = 'Envase';
      else if (physical?.rejectionReasons?.length) motivo = physical.rejectionReasons[0];

      return {
        fecha: b.creationDate,
        unidad: bottlesInBatch[0]?.hospitalInitials || 'BLH',
        tipoDonadora: donor?.donorCategory === 'INTERNAL' ? 'Interna' : 'Externa',
        cantidad: b.bottleCount,
        motivo,
        estadoFinal: 'Desechada',
        observaciones: qc?.notes || physical?.observations || '',
        volumen: b.totalVolume
      };
    }));

    const totalAnalizadas = analyzedBatches.reduce((acc, b) => acc + b.bottleCount, 0);
    const totalInadecuadas = rows.reduce((acc, r) => acc + r.cantidad, 0);
    const porcentajeRechazo = totalAnalizadas > 0 ? (totalInadecuadas / totalAnalizadas) * 100 : 0;

    const causeCounts: Record<string, number> = {};
    rows.forEach(r => causeCounts[r.motivo] = (causeCounts[r.motivo] || 0) + 1);
    const causaPrincipal = Object.entries(causeCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { rows, totalAnalizadas, totalInadecuadas, porcentajeRechazo, causaPrincipal };
  },

  getQualityStats: async (): Promise<QualityStats> => {
    const batches = await batchService.getAll();
    const approved = batches.filter(b => b.status === 'APPROVED').length;
    const rejected = batches.filter(b => b.status === 'REJECTED').length;
    const rejectionReasons = [
      { reason: 'Acidez Elevada', count: 3 },
      { reason: 'Suciedad/Impurezas', count: 1 },
      { reason: 'Coliformes', count: 1 },
      { reason: 'Color Anormal', count: 0 },
    ];
    return { approvedCount: approved, rejectedCount: rejected, rejectionReasons };
  },
  
  downloadCSV: (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => {
        const val = row[fieldName];
        return typeof val === 'string' ? `"${val}"` : val;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
