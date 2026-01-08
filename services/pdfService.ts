
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PDF_TEMPLATE_KEY = 'blh_consent_template';

export interface ConsentData {
  unidadMedica: string;
  fecha: string;
  nombreDonadora: string;
  consentimientoSi: boolean;
  personalSalud: string;
}

export interface InadequateReportData {
  rangoFechas: string;
  unidadMedica: string;
  rows: any[];
  stats: {
    totalAnalizadas: number;
    totalInadecuadas: number;
    porcentajeRechazo: number;
    causaPrincipal: string;
  };
  responsable: string;
}

export interface DonorsDetailedReportData {
  periodo: string;
  año: number;
  donadoras: any[];
  stats: {
    total: number;
    aptas: number;
    noAptas: number;
  };
  responsable: string;
}

export const pdfService = {
  formatStaffName: (fullName: string): string => {
    const cleanName = fullName.replace(/^(Dra\.|Dr\.|Enf\.|Lic\.|Q\.F\.B\.)\s+/i, '').trim();
    const parts = cleanName.split(/\s+/);
    if (parts.length < 2) return cleanName;
    const initial = parts[0].charAt(0).toUpperCase();
    const firstSurname = parts[1];
    return `${initial}. ${firstSurname}`;
  },

  /**
   * REPORTE: Listado Detallado de Donadoras Registradas
   */
  generateDonorsDetailedReport: async (data: DonorsDetailedReportData): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Vertical
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const margin = 50;
    let y = height - 50;

    // Header Institucional
    page.drawText('ISEM | BANCO DE LECHE HUMANA', { x: margin, y, size: 10, font: fontBold, color: rgb(0.6, 0, 0.2) });
    y -= 25;
    page.drawText('REPORTE DE CAPTACIÓN DE DONADORAS', { x: margin, y, size: 14, font: fontBold });
    y -= 18;
    page.drawText(`Período: ${data.periodo} - ${data.año}`, { x: margin, y, size: 10, font: fontRegular });
    
    // Stats Summary Box
    y -= 40;
    page.drawRectangle({ x: margin, y: y - 50, width: width - (margin * 2), height: 60, color: rgb(0.98, 0.95, 0.96), borderColor: rgb(0.9, 0.8, 0.8), borderWidth: 1 });
    page.drawText('RESUMEN DE REGISTROS', { x: margin + 10, y: y - 5, size: 9, font: fontBold });
    page.drawText(`Total Registradas: ${data.stats.total}`, { x: margin + 10, y: y - 25, size: 9, font: fontRegular });
    page.drawText(`Aptas: ${data.stats.aptas}`, { x: margin + 120, y: y - 25, size: 9, font: fontRegular });
    page.drawText(`No Aptas: ${data.stats.noAptas}`, { x: margin + 230, y: y - 25, size: 9, font: fontRegular });
    
    y -= 70;

    // Table Header
    const colWidths = [80, 180, 100, 80, 80];
    const headers = ['FOLIO', 'NOMBRE COMPLETO', 'REGISTRO', 'ESTATUS', 'TIPO'];
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.9, 0.9, 0.9) });
    
    let currentX = margin;
    headers.forEach((h, i) => {
      page.drawText(h, { x: currentX + 5, y, size: 8, font: fontBold });
      currentX += colWidths[i];
    });

    y -= 20;

    // Donor Rows
    data.donadoras.forEach((d, idx) => {
      if (y < 100) return; // Prevent overflow for demo
      currentX = margin;
      if (idx % 2 === 0) {
        page.drawRectangle({ x: margin, y: y - 12, width: width - (margin * 2), height: 18, color: rgb(0.97, 0.97, 0.97) });
      }
      
      const rowData = [
        d.folio || 'N/A',
        `${d.firstName} ${d.lastName}`.toUpperCase(),
        d.registrationDate,
        d.status === 'ACTIVE' ? 'APTA' : 'NO APTA',
        d.donorCategory || 'EXTERNA'
      ];

      rowData.forEach((val, i) => {
        page.drawText(val.toString(), { x: currentX + 5, y: y - 5, size: 8, font: fontRegular });
        currentX += colWidths[i];
      });
      y -= 18;
    });

    // Signature Area
    const sigY = 80;
    page.drawLine({ start: { x: width/2 - 100, y: sigY + 20 }, end: { x: width/2 + 100, y: sigY + 20 }, thickness: 1 });
    page.drawText('RESPONSABLE DE CAPTACIÓN', { x: width/2 - 70, y: sigY + 5, size: 8, font: fontBold });
    page.drawText(data.responsable.toUpperCase(), { x: width/2 - 80, y: sigY - 10, size: 9, font: fontRegular });

    return await pdfDoc.save();
  },

  generateInadequateSamplesReport: async (data: InadequateReportData): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]); 
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();
    const margin = 40;
    let y = height - 40;

    page.drawText('BANCO DE LECHE HUMANA | REPORTE DE CALIDAD', { x: margin, y, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
    y -= 25;
    page.drawText('FRECUENCIA MENSUAL DE MUESTRAS INADECUADAS', { x: margin, y, size: 16, font: fontBold });
    y -= 20;
    page.drawText(`Período: ${data.rangoFechas}`, { x: margin, y, size: 11, font: fontRegular });
    
    y -= 40;
    const colWidths = [70, 100, 80, 60, 120, 80, 140, 60];
    const headers = ['FECHA', 'UNIDAD', 'TIPO DON.', 'FRASCOS', 'MOTIVO RECHAZO', 'ESTADO', 'OBSERVACIONES', 'VOL. ml'];
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.9, 0.9, 0.9) });
    
    let currentX = margin;
    headers.forEach((h, i) => {
      page.drawText(h, { x: currentX + 5, y, size: 8, font: fontBold });
      currentX += colWidths[i];
    });

    y -= 20;
    data.rows.forEach((row, rowIndex) => {
      if (y < 80) return;
      currentX = margin;
      const rowData = [row.fecha, row.unidad, row.tipoDonadora, row.cantidad.toString(), row.motivo, row.estadoFinal, row.observaciones.substring(0, 20), row.volumen.toString()];
      if (rowIndex % 2 === 0) page.drawRectangle({ x: margin, y: y - 12, width: width - (margin * 2), height: 18, color: rgb(0.97, 0.97, 0.97) });
      rowData.forEach((val, i) => {
        page.drawText(val, { x: currentX + 5, y: y - 5, size: 8, font: fontRegular });
        currentX += colWidths[i];
      });
      y -= 18;
    });

    return await pdfDoc.save();
  },

  generateOfficialConsent: async (data: ConsentData): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();
    const margin = 50;
    let currentY = height - 50;
    page.drawText('CONSENTIMIENTO INFORMADO PARA LA DONACIÓN DE LECHE MATERNA', { x: width / 2 - 200, y: currentY, size: 12, font: fontBold });
    currentY -= 30;
    page.drawText('Unidad Médica:', { x: margin, y: currentY, size: 10, font: fontRegular });
    const unidadField = form.createTextField('unidad_medica');
    unidadField.setText(data.unidadMedica);
    unidadField.addToPage(page, { x: margin + 80, y: currentY - 2, width: 250, height: 15 });
    
    return await pdfDoc.save();
  },

  downloadPdf: (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  }
};
