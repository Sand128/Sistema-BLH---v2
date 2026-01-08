
import { KPIMetrics, TrendPoint, QualityStats, Batch, Bottle, Donor } from '../types';
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

export interface DonorsReportParams {
  status: 'ALL' | 'ACTIVE' | 'REJECTED';
  category: 'ALL' | 'INTERNAL' | 'EXTERNAL' | 'HOME' | 'LACTARIUM';
  periodType: 'BIMONTHLY' | 'SEMESTRAL';
  periodValue: number; // 1-6 for bimonthly, 1-2 for semestral
  year: number;
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

  getDonorsReportData: async (params: DonorsReportParams): Promise<{ donors: Donor[], stats: any }> => {
    const allDonors = await donorService.getAll();
    
    // Calculate Date Range
    let startDate: Date;
    let endDate: Date;

    if (params.periodType === 'BIMONTHLY') {
      const startMonth = (params.periodValue - 1) * 2;
      startDate = new Date(params.year, startMonth, 1);
      endDate = new Date(params.year, startMonth + 2, 0);
    } else {
      const startMonth = (params.periodValue - 1) * 6;
      startDate = new Date(params.year, startMonth, 1);
      endDate = new Date(params.year, startMonth + 6, 0);
    }

    const filtered = allDonors.filter(d => {
      const regDate = new Date(d.registrationDate);
      const dateMatch = regDate >= startDate && regDate <= endDate;
      const statusMatch = params.status === 'ALL' || d.status === params.status;
      // Fix: Changed d.category to d.donorCategory to match Donor interface
      const categoryMatch = params.category === 'ALL' || d.donorCategory === params.category;
      return dateMatch && statusMatch && categoryMatch;
    });

    const stats = {
      total: filtered.length,
      aptas: filtered.filter(d => d.status === 'ACTIVE').length,
      noAptas: filtered.filter(d => d.status === 'REJECTED').length,
      periodLabel: params.periodType === 'BIMONTHLY' ? `Bimestre ${params.periodValue}` : `Semestre ${params.periodValue}`,
      year: params.year
    };

    return { donors: filtered, stats };
  },

  getMonthlyFrequencyTable: async (startDate: string, endDate: string): Promise<MonthlyFrequencyRow[]> => {
    const batches = await batchService.getAll();
    const analyzedBatches = batches.filter(b => 
      b.creationDate >= startDate && 
      b.creationDate <= endDate && 
      ['APPROVED', 'REJECTED', 'PENDING_QC'].includes(b.status)
    );

    const groups: Record<string, Batch[]> = {};
    for (const b of analyzedBatches) {
      const date = new Date(b.creationDate);
      const monthKey = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substr(-2)}`;
      const unit = "HMPMPS";
      const groupKey = `${unit}-${monthKey}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(b);
    }

    const tableData: MonthlyFrequencyRow[] = await Promise.all(Object.entries(groups).map(async ([key, groupBatches]) => {
      const [unit, monthYear] = key.split('-');
      const totalAnalizadas = groupBatches.reduce((acc, b) => acc + b.bottleCount, 0);
      let acidez = 0, envase = 0, suciedad = 0, colorFlavor = 0;
      let resp = 'Dra. Elena Torres';

      for (const b of groupBatches) {
        if (b.status === 'REJECTED') {
          const qc = await batchService.getQCRecord(b.id);
          const phys = await batchService.getPhysicalQCRecord(b.id);
          if (qc?.acidityDornic && qc.acidityDornic > 8) acidez += b.bottleCount;
          if (phys && (!phys.containerState.integrity || !phys.containerState.lid || !phys.containerState.seal)) envase += b.bottleCount;
          if (qc?.coliformsPresence) suciedad += b.bottleCount;
          if (qc?.flavor === 'OFF_FLAVOR') colorFlavor += b.bottleCount;
          if (qc?.inspectorName) resp = qc.inspectorName;
        }
      }

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
        total_muestras_inadecuadas: acidez + envase + suciedad + colorFlavor,
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
    const analyzedBatches = batches.filter(b => b.creationDate >= startDate && b.creationDate <= endDate && ['APPROVED', 'REJECTED'].includes(b.status));
    const inadequateBatches = analyzedBatches.filter(b => b.status === 'REJECTED');
    
    const rows: InadequateSampleRow[] = await Promise.all(inadequateBatches.map(async (b) => {
      const qc = await batchService.getQCRecord(b.id);
      const physical = await batchService.getPhysicalQCRecord(b.id);
      const bottlesInBatch = await batchService.getBottlesByBatchId(b.id);
      const donor = donors.find(d => d.id === bottlesInBatch[0]?.donorId);

      return {
        fecha: b.creationDate,
        unidad: bottlesInBatch[0]?.hospitalInitials || 'BLH',
        tipoDonadora: donor?.donorCategory === 'INTERNAL' ? 'Interna' : 'Externa',
        cantidad: b.bottleCount,
        motivo: qc?.acidityDornic && qc.acidityDornic > 8 ? 'Acidez' : 'Envase/Otros',
        estadoFinal: 'Desechada',
        observaciones: qc?.notes || '',
        volumen: b.totalVolume
      };
    }));

    const totalAnalizadas = analyzedBatches.reduce((acc, b) => acc + b.bottleCount, 0);
    const totalInadecuadas = rows.reduce((acc, r) => acc + r.cantidad, 0);
    return { 
      rows, 
      totalAnalizadas, 
      totalInadecuadas, 
      porcentajeRechazo: totalAnalizadas > 0 ? (totalInadecuadas / totalAnalizadas) * 100 : 0,
      causaPrincipal: 'Acidez Elevada'
    };
  },

  getQualityStats: async (): Promise<QualityStats> => {
    const batches = await batchService.getAll();
    const approved = batches.filter(b => b.status === 'APPROVED').length;
    const rejected = batches.filter(b => b.status === 'REJECTED').length;
    return { 
      approvedCount: approved, 
      rejectedCount: rejected, 
      rejectionReasons: [{ reason: 'Acidez Elevada', count: rejected }] 
    };
  }
};
