import ejs from 'ejs';
import path from 'path';
import QRCode from 'qrcode';
import puppeteer from 'puppeteer';
import writtenNumber from 'written-number';

writtenNumber.defaults.lang = 'fr';

export async function renderInvoicePdf(data: any): Promise<Buffer> {
  const templatePath = path.join(__dirname, 'template.ejs');
  const qrDataUrl = await QRCode.toDataURL(data.whatsAppLink || '');

  const amountInWords = `${writtenNumber(Math.round(data.total))} francs CFA`;

  const html = await ejs.renderFile(templatePath, {
    ...data,
    qrDataUrl,
    amountInWords,
    discountLabel:
      data.discountType === 'percent'
        ? `${data.discountValue}%`
        : `${data.discountValue.toLocaleString()} FCFA`,
    vatLabel: data.vatEnabled ? `${data.vatRate}%` : 'N/A',
  }) as string;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
