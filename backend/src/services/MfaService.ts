import { generateSecret, generateSync, verifySync, generateURI } from 'otplib';
import QRCode from 'qrcode';

const APP_NAME = 'WE Sample App';

const mfaService = {
  generateSecret(username: string): { secret: string; otpauthUrl: string } {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ label: username, issuer: APP_NAME, secret });
    return { secret, otpauthUrl };
  },

  async generateQrCode(otpauthUrl: string): Promise<string> {
    return QRCode.toDataURL(otpauthUrl);
  },

  verifyToken(secret: string, token: string): boolean {
    try {
      const result = verifySync({ token, secret });
      return result.valid === true;
    } catch {
      return false;
    }
  },

  generateToken(secret: string): string {
    return generateSync({ secret });
  },
};

export default mfaService;
