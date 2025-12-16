
import { KPIMetrics, TrendPoint, QualityStats } from '../types';
import { batchService } from './batchService';
import { donorService } from './donorService';
import { recipientService } from './recipientService';
import { AdministrationRecord } from '../types';

export const reportService = {
  getKPIMetrics: async (): Promise<KPIMetrics> => {
    // 1. Get Data
    const donors = await donorService.getAll();
    const batches = await batchService.getAll();
    
    // 2. Calculate Active Donors (last 30 days active logic - simplifying to Status=ACTIVE for V1)
    const activeDonorsCount = donors.filter(d => d.status === 'ACTIVE').length;

    // 3. Quality Approval Rate
    // Count batches with final status APPROVED or REJECTED
    const concludedBatches = batches.filter(b => b.status === 'APPROVED' || b.status === 'REJECTED');
    const approvedBatches = concludedBatches.filter(b => b.status === 'APPROVED').length;
    const qualityApprovalRate = concludedBatches.length > 0 
      ? Math.round((approvedBatches / concludedBatches.length) * 100) 
      : 100;

    // 4. Waste Rate (Mock calculation based on dismissed volume vs collected)
    // In V1 we use a placeholder or calculate based on discarded bottles
    const wasteRate = 2.5; // Mock 2.5%

    // 5. Processing Time (Mock)
    const avgProcessingTimeHours = 48; 

    return {
      activeDonorsCount,
      qualityApprovalRate,
      avgProcessingTimeHours,
      wasteRate
    };
  },

  getVolumeTrends: async (months = 6): Promise<TrendPoint[]> => {
    const batches = await batchService.getAll();
    // Administration history is not fully exposed in recipientService via getAll, 
    // we need to access the mock data directly or add a method. 
    // Assuming we can fetch all administrations:
    // In a real app, this would be a specific backend query.
    // For this mock, we will grab all administrations if possible or simulate.
    
    // We'll use a rough simulation based on mock data dates
    const today = new Date();
    const trends: TrendPoint[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Filter batches created in this month
      const monthBatches = batches.filter(b => b.creationDate.startsWith(key));
      const collected = monthBatches.reduce((sum, b) => sum + b.totalVolume, 0);

      // Filter administrations in this month (Need to fetch all)
      // Since we don't have a "getAllAdministrations" exposed efficiently, we simulate admin volume ~ 80% of collected
      // But we DO have MOCK_ADMINISTRATIONS in mockData.ts, let's try to infer if we can.
      // We will assume admin volume is roughly tracked or use the mock data records we have.
      
      // Basic mock logic for visual demo if data is sparse:
      const adminVolume = Math.round(collected * (0.8 + Math.random() * 0.15));

      trends.push({
        date: key,
        collectedVolume: collected,
        administeredVolume: adminVolume
      });
    }
    return trends;
  },

  getQualityStats: async (): Promise<QualityStats> => {
    const batches = await batchService.getAll();
    const approved = batches.filter(b => b.status === 'APPROVED').length;
    const rejected = batches.filter(b => b.status === 'REJECTED').length;

    // In a real app, we would query rejection reasons from QC records
    // Mocking reasons distribution
    const rejectionReasons = [
      { reason: 'Acidez Elevada', count: 3 },
      { reason: 'Suciedad/Impurezas', count: 1 },
      { reason: 'Coliformes', count: 1 },
      { reason: 'Color Anormal', count: 0 },
    ];

    return {
      approvedCount: approved,
      rejectedCount: rejected,
      rejectionReasons
    };
  },
  
  // Helpers for Export
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
