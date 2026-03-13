import QRCode from 'qrcode';

export const generateStudentVerificationQrPng = async ({ uid }) => {
  const baseUrl = (process.env.PUBLIC_BASE_URL || process.env.APP_BASE_URL || 'http://localhost:5000').replace(
    /\/$/,
    ''
  );
  const payload = `${baseUrl}/api/public/student/${uid}`;

  return QRCode.toBuffer(payload, {
    type: 'png',
    width: 320,
    margin: 1,
    errorCorrectionLevel: 'M'
  });
};
