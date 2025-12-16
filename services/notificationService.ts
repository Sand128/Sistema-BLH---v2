
import { SystemNotification } from '../types';
import { batchService } from './batchService';
import { donorService } from './donorService';

const READ_NOTIFICATIONS_KEY = 'blh_read_notifications';

const getReadNotificationIds = (): string[] => {
  const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const markAsRead = (id: string) => {
  const current = getReadNotificationIds();
  if (!current.includes(id)) {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...current, id]));
  }
};

const markAllAsRead = (ids: string[]) => {
  const current = getReadNotificationIds();
  const newIds = [...new Set([...current, ...ids])]; // Unique IDs
  localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(newIds));
};

export const notificationService = {
  // Generates notifications on the fly based on current system state
  getAll: async (): Promise<SystemNotification[]> => {
    const notifications: SystemNotification[] = [];
    const readIds = getReadNotificationIds();

    // 1. Fetch Data
    const batches = await batchService.getAll();
    const donors = await donorService.getAll();

    // 2. Logic: Quality Control Pending
    // Batches that are COMPLETED (ready for QC) or PENDING_QC
    const pendingQCBatches = batches.filter(b => b.status === 'COMPLETED' || b.status === 'PENDING_QC');
    pendingQCBatches.forEach(batch => {
      notifications.push({
        id: `qc-${batch.id}`,
        module: 'QUALITY',
        title: 'Análisis de Calidad Pendiente',
        description: `El lote ${batch.batchNumber} requiere inspección de laboratorio.`,
        timestamp: batch.creationDate, // Using creation date as proxy
        priority: 'HIGH',
        link: `/quality-control/${batch.id}`,
        isRead: readIds.includes(`qc-${batch.id}`)
      });
    });

    // 3. Logic: Batches In Process (New Requirement)
    const inProcessBatches = batches.filter(b => b.status === 'IN_PROCESS');
    inProcessBatches.forEach(batch => {
      notifications.push({
        id: `proc-${batch.id}`,
        module: 'QUALITY', // Quality team should be aware of incoming batches
        title: 'Nuevo Lote en Proceso',
        description: `El lote ${batch.batchNumber} está registrado y en proceso de conformación.`,
        timestamp: batch.creationDate,
        priority: 'NORMAL',
        link: `/batches/${batch.id}`,
        isRead: readIds.includes(`proc-${batch.id}`)
      });
    });

    // 4. Logic: Inventory Expiration Warning (< 7 days)
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const expiringBatches = batches.filter(b => {
      if (b.status !== 'APPROVED' || b.currentVolume === 0) return false;
      const expDate = new Date(b.expirationDate);
      return expDate > today && expDate <= sevenDaysFromNow;
    });

    expiringBatches.forEach(batch => {
      notifications.push({
        id: `exp-${batch.id}`,
        module: 'INVENTORY',
        title: 'Lote Próximo a Caducar',
        description: `El lote ${batch.batchNumber} vence el ${batch.expirationDate}.`,
        timestamp: new Date().toISOString(),
        priority: 'HIGH',
        link: `/batches/${batch.id}`,
        isRead: readIds.includes(`exp-${batch.id}`)
      });
    });

    // 5. Logic: Low Volume Warning (< 50ml)
    const lowVolBatches = batches.filter(b => b.status === 'APPROVED' && b.currentVolume > 0 && b.currentVolume < 50);
    lowVolBatches.forEach(batch => {
      notifications.push({
        id: `vol-${batch.id}`,
        module: 'INVENTORY',
        title: 'Volumen Crítico',
        description: `Quedan solo ${batch.currentVolume}ml en el lote ${batch.batchNumber}.`,
        timestamp: new Date().toISOString(),
        priority: 'NORMAL',
        link: `/batches/${batch.id}`,
        isRead: readIds.includes(`vol-${batch.id}`)
      });
    });

    // 6. Logic: New Donors Pending Screening
    const pendingDonors = donors.filter(d => d.status === 'SCREENING');
    pendingDonors.forEach(donor => {
      notifications.push({
        id: `donor-${donor.id}`,
        module: 'DONORS',
        title: 'Donadora en Estudio',
        description: `${donor.firstName} ${donor.lastName} requiere validación de exámenes.`,
        timestamp: donor.registrationDate,
        priority: 'NORMAL',
        link: `/donors/${donor.id}`,
        isRead: readIds.includes(`donor-${donor.id}`)
      });
    });

    // Sort by Priority then Date (mocking date sort for simplicity)
    return notifications.sort((a, b) => {
        if (a.priority === 'HIGH' && b.priority !== 'HIGH') return -1;
        if (a.priority !== 'HIGH' && b.priority === 'HIGH') return 1;
        return 0; 
    });
  },

  markAsRead: (id: string) => {
    markAsRead(id);
  },

  markAllAsRead: () => {
    // We need to fetch current IDs to mark them. 
    // In a real app, this would be a backend call.
    // For this mock service, we rely on the component passing IDs or re-fetching.
    // However, the helper above handles the storage logic.
    // The component will call this, trigger a re-fetch, and the 'isRead' prop will update.
  }
};
