import QRCode from 'qrcode';

class QRService {
  async generateQRCode(data) {
    try {
      return await QRCode.toDataURL(JSON.stringify(data));
    } catch (error) {
      throw new Error(`QR Code generation failed: ${error.message}`);
    }
  }

  async generateQRCodeBuffer(data) {
    try {
      return await QRCode.toBuffer(JSON.stringify(data));
    } catch (error) {
      throw new Error(`QR Code buffer generation failed: ${error.message}`);
    }
  }
}

export const qrService = new QRService();
