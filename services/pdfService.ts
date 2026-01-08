
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
   * REPORTE: Frecuencia Mensual de Muestras Inadecuadas
   */
  generateInadequateSamplesReport: async (data: InadequateReportData): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([792, 612]); // Horizontal (Landscape)
    const { width, height } = page.getSize();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    const margin = 40;
    let y = height - 40;

    // Header
    page.drawText('BANCO DE LECHE HUMANA | REPORTE DE CALIDAD', { x: margin, y, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) });
    y -= 25;
    page.drawText('FRECUENCIA MENSUAL DE MUESTRAS INADECUADAS', { x: margin, y, size: 16, font: fontBold });
    y -= 20;
    page.drawText(`Período: ${data.rangoFechas}`, { x: margin, y, size: 11, font: fontRegular });
    
    // Meta Fields (Editables)
    y -= 30;
    page.drawText('Unidad Médica:', { x: margin, y, size: 10, font: fontBold });
    const unidadField = form.createTextField('unidad_medica');
    unidadField.setText(data.unidadMedica);
    unidadField.addToPage(page, { x: margin + 85, y: y - 3, width: 300, height: 15 });

    // Table Header
    y -= 40;
    const colWidths = [70, 100, 80, 60, 120, 80, 140, 60];
    const headers = ['FECHA', 'UNIDAD', 'TIPO DON.', 'FRASCOS', 'MOTIVO RECHAZO', 'ESTADO', 'OBSERVACIONES', 'VOL. ml'];
    
    // Draw Header Background
    page.drawRectangle({ x: margin, y: y - 5, width: width - (margin * 2), height: 20, color: rgb(0.9, 0.9, 0.9) });
    
    let currentX = margin;
    headers.forEach((h, i) => {
      page.drawText(h, { x: currentX + 5, y, size: 8, font: fontBold });
      currentX += colWidths[i];
    });

    y -= 20;

    // Rows
    data.rows.forEach((row, rowIndex) => {
      if (y < 80) return; // Simple overflow check
      currentX = margin;
      const rowData = [
        row.fecha,
        row.unidad,
        row.tipoDonadora,
        row.cantidad.toString(),
        row.motivo,
        row.estadoFinal,
        row.observaciones.substring(0, 30),
        row.volumen.toString()
      ];

      // Zebra striping
      if (rowIndex % 2 === 0) {
        page.drawRectangle({ x: margin, y: y - 12, width: width - (margin * 2), height: 18, color: rgb(0.97, 0.97, 0.97) });
      }

      rowData.forEach((val, i) => {
        page.drawText(val, { x: currentX + 5, y: y - 5, size: 8, font: fontRegular });
        currentX += colWidths[i];
      });
      y -= 18;
    });

    // Summary Box
    y -= 40;
    const summaryX = width - 300;
    page.drawRectangle({ x: summaryX, y: y - 60, width: 260, height: 80, color: rgb(0.95, 0.98, 1), borderColor: rgb(0.8, 0.8, 0.9), borderWidth: 1 });
    
    let sy = y;
    page.drawText('RESUMEN ESTADÍSTICO', { x: summaryX + 10, y: sy, size: 10, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
    sy -= 18;
    page.drawText(`Total Muestras Analizadas: ${data.stats.totalAnalizadas}`, { x: summaryX + 10, y: sy, size: 9, font: fontRegular });
    sy -= 14;
    page.drawText(`Total Muestras Inadecuadas: ${data.stats.totalInadecuadas}`, { x: summaryX + 10, y: sy, size: 9, font: fontRegular });
    sy -= 14;
    page.drawText(`Porcentaje de Rechazo: ${data.stats.porcentajeRechazo.toFixed(2)}%`, { x: summaryX + 10, y: sy, size: 10, font: fontBold, color: data.stats.porcentajeRechazo > 10 ? rgb(0.8, 0, 0) : rgb(0, 0.5, 0) });

    // Alertas
    if (data.stats.porcentajeRechazo > 5) {
        page.drawText('ALERTA: Tasa de rechazo superior al umbral permitido.', { x: margin, y: sy, size: 9, font: fontBold, color: rgb(0.8, 0, 0) });
        page.drawText(`Causa recurrente: ${data.stats.causaPrincipal}`, { x: margin, y: sy - 14, size: 9, font: fontRegular });
    }

    // Signatures
    const sigY = 60;
    page.drawText('Responsable de Verificación', { x: margin, y: sigY + 20, size: 10, font: fontBold });
    page.drawLine({ start: { x: margin, y: sigY + 18 }, end: { x: margin + 200, y: sigY + 18 }, thickness: 1 });
    const respField = form.createTextField('responsable_firma');
    respField.setText(data.responsable.toUpperCase());
    respField.addToPage(page, { x: margin, y: sigY, width: 200, height: 15 });

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
    page.drawText('Fecha:', { x: margin + 350, y: currentY, size: 10, font: fontRegular });
    const fechaField = form.createTextField('fecha');
    fechaField.setText(data.fecha);
    fechaField.addToPage(page, { x: margin + 390, y: currentY - 2, width: 80, height: 15 });
    currentY -= 40;
    const text1 = 'Con fundamento en la Ley General de Salud, y en la Ley para la Protección, Apoyo y Promoción a la Lactancia Materna del Estado de México.';
    page.drawText(text1, { x: margin, y: currentY, size: 10, font: fontRegular, maxWidth: width - (margin * 2) });
    currentY -= 30;
    page.drawText('La que suscribe Sra.', { x: margin, y: currentY, size: 10, font: fontRegular });
    const nombreField = form.createTextField('nombre_donadora');
    nombreField.setText(data.nombreDonadora.toUpperCase());
    nombreField.addToPage(page, { x: margin + 95, y: currentY - 2, width: 300, height: 15 });
    currentY -= 20;
    const text2 = 'en forma voluntaria y sin ninguna presión o inducción consiento donar una o varias muestras de leche materna...';
    page.drawText(text2, { x: margin, y: currentY, size: 10, font: fontRegular, maxWidth: width - (margin * 2), lineHeight: 14 });
    currentY -= 28;
    page.drawText('sí:', { x: margin, y: currentY, size: 10, font: fontRegular });
    const checkSi = form.createCheckBox('consentimiento_si');
    if (data.consentimientoSi) checkSi.check();
    checkSi.addToPage(page, { x: margin + 20, y: currentY - 2, width: 12, height: 12 });
    page.drawText('no:', { x: margin + 50, y: currentY, size: 10, font: fontRegular });
    const checkNo = form.createCheckBox('consentimiento_no');
    if (!data.consentimientoSi) checkNo.check();
    checkNo.addToPage(page, { x: margin + 70, y: currentY - 2, width: 12, height: 12 });
    currentY -= 40;
    const sigY = 100;
    const firmaDonadora = form.createTextField('firma_donadora');
    firmaDonadora.setText(data.nombreDonadora.toUpperCase());
    firmaDonadora.addToPage(page, { x: margin, y: sigY, width: 220, height: 15 });
    const personalSalud = form.createTextField('personal_salud');
    personalSalud.setText(data.personalSalud.toUpperCase());
    personalSalud.addToPage(page, { x: width - 280, y: sigY, width: 220, height: 15 });
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
  },

  generateConsentPdf: async (donorName: string): Promise<Uint8Array> => {
      return pdfService.generateOfficialConsent({
          unidadMedica: 'Banco de Leche Humana',
          fecha: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' }),
          nombreDonadora: donorName,
          consentimientoSi: true,
          personalSalud: 'Personal de Salud'
      });
  },

  saveTemplate: async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        localStorage.setItem(PDF_TEMPLATE_KEY, base64);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
