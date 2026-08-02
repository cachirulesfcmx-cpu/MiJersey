import QRCode from 'qrcode';

/** Codifica la URI `otpauth://` como PNG data URL para que el admin la escanee sin transcribir el secreto a mano. */
export function generateMfaQrCode(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl);
}
