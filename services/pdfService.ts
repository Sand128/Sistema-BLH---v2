
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const PDF_TEMPLATE_KEY = 'blh_consent_template';

export const pdfService = {
  /**
   * Obtiene la plantilla actual (Base64) o genera una por defecto si no existe.
   */
  getTemplate: async (): Promise<string> => {
    const stored = localStorage.getItem(PDF_TEMPLATE_KEY);
    if (stored) return stored;

    // Generar PDF por defecto si no hay uno subido
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('BANCO DE LECHE HUMANA - CONSENTIMIENTO INFORMADO', {
      x: 50,
      y: height - 50,
      size: 18,
      font,
      color: rgb(0.8, 0, 0.4), // Pink color
    });

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const text = `
    Por la presente, yo ___________________________________________________________,
    
    Identificada con los datos registrados en mi expediente clínico, declaro libre y voluntariamente
    mi deseo de participar como donadora de leche humana.
    
    Comprendo que:
    1. Mi donación es altruista y no recibiré remuneración económica.
    2. La leche donada será procesada y analizada para garantizar su seguridad.
    3. La leche será administrada a recién nacidos hospitalizados que la requieran bajo
       criterio médico.
    4. He recibido información sobre la extracción, conservación y transporte de la leche.
    5. Mis datos personales serán tratados con confidencialidad.
    
    Me comprometo a informar al Banco de Leche sobre cualquier enfermedad, medicación o
    cambio en mi estilo de vida que pueda afectar la calidad de la leche.
    
    
    
    __________________________                    __________________________
            Firma Donadora                                    Firma Testigo
            
            
    Fecha: ___________________
    `;

    page.drawText(text, {
      x: 50,
      y: height - 120,
      size: 12,
      font: fontRegular,
      lineHeight: 24,
    });

    return await pdfDoc.saveAsBase64();
  },

  /**
   * Guarda una nueva plantilla subida por el admin
   */
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
  },

  /**
   * Genera el PDF final con el nombre de la donadora
   */
  generateConsentPdf: async (donorName: string): Promise<Uint8Array> => {
    const base64Template = await pdfService.getTemplate();
    const pdfDoc = await PDFDocument.load(base64Template);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { height } = firstPage.getSize();

    // Embed font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    // Coordenadas aproximadas para llenar la línea "Yo, _______"
    // En el PDF por defecto, la línea está cerca de Y = height - 120 (approx line 2)
    // Ajustamos manualmente. Si el usuario sube su propio PDF, debería coincidir 
    // o podríamos hacer esto configurable. Por ahora, asumimos el formato estándar.
    
    // Dibujar nombre
    firstPage.drawText(donorName.toUpperCase(), {
      x: 160, // Ajuste horizontal para caer en la línea
      y: height - 138, // Ajuste vertical
      size: 12,
      font: font,
      color: rgb(0, 0, 0.5), // Azul oscuro para diferenciar lo llenado
    });

    // Dibujar Fecha actual
    const today = new Date().toLocaleDateString();
    firstPage.drawText(today, {
      x: 100,
      y: height - 565, // Coordenada aproximada para fecha al final
      size: 12,
      font: font,
    });

    return await pdfDoc.save();
  },

  /**
   * Dispara la descarga en el navegador
   */
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
