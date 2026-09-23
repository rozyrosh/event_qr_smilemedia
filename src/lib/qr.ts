import QRCode from 'qrcode';
import crypto from 'crypto';

export function generateCryptoUUID(): string {
  return crypto.randomUUID();
}

export async function generateQRCodeDataURL(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}
