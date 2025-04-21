import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ottieni il percorso del file corrente
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL dell'applicazione web
const appURL = 'https://nutrieasy.replit.app';

// Assicurati che la directory "qrcodes" esista
const qrCodeDir = path.join(__dirname, 'client', 'public', 'qrcodes');
if (!fs.existsSync(qrCodeDir)) {
  fs.mkdirSync(qrCodeDir, { recursive: true });
}

// Genera QR code per iOS con messaggio specifico
const generateIOSQRCode = async () => {
  const iosFilePath = path.join(qrCodeDir, 'ios_install_qrcode.png');
  try {
    await QRCode.toFile(iosFilePath, appURL, {
      color: {
        dark: '#000',  // Colore dei punti del QR code
        light: '#FFF'  // Colore dello sfondo
      },
      width: 512,      // Dimensione del QR code
      margin: 1,       // Margine intorno al QR code
      errorCorrectionLevel: 'H'  // Livello di correzione degli errori (H è il più alto)
    });
    console.log(`QR code per iOS generato con successo: ${iosFilePath}`);
  } catch (err) {
    console.error('Errore durante la generazione del QR code per iOS:', err);
  }
};

// Genera QR code per Android con messaggio specifico
const generateAndroidQRCode = async () => {
  const androidFilePath = path.join(qrCodeDir, 'android_install_qrcode.png');
  try {
    await QRCode.toFile(androidFilePath, appURL, {
      color: {
        dark: '#3DDC84', // Verde di Android
        light: '#FFF'
      },
      width: 512,
      margin: 1,
      errorCorrectionLevel: 'H'
    });
    console.log(`QR code per Android generato con successo: ${androidFilePath}`);
  } catch (err) {
    console.error('Errore durante la generazione del QR code per Android:', err);
  }
};

// Genera entrambi i QR code
const generateAllQRCodes = async () => {
  console.log('Generazione dei QR code per l\'installazione dell\'app...');
  await generateIOSQRCode();
  await generateAndroidQRCode();
  console.log('Generazione dei QR code completata.');
};

generateAllQRCodes();