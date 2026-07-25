/**
 * Lädt den Inhalt von dist/ per FTP auf den STRATO-Webspace.
 *
 * Aufruf:  npm run deploy
 *
 * Die Zugangsdaten kommen aus der Datei .env im Projektordner. Diese Datei
 * ist über .gitignore ausgeschlossen und landet nie auf GitHub.
 */

import { Client } from 'basic-ftp';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DIST = resolve('dist');

const {
  FTP_SERVER,
  FTP_USERNAME,
  FTP_PASSWORD,
  FTP_DIR = '/',
  FTP_SECURE = 'true',
} = process.env;

const fehler = (text) => {
  console.error(`\n  ✖  ${text}\n`);
  process.exit(1);
};

// --- Vorprüfungen -------------------------------------------------------

if (!existsSync(DIST)) {
  fehler('Der Ordner dist/ fehlt. Bitte zuerst "npm run build" ausführen.');
}

const fehlend = ['FTP_SERVER', 'FTP_USERNAME', 'FTP_PASSWORD'].filter(
  (name) => !process.env[name],
);

if (fehlend.length > 0) {
  fehler(
    `In der Datei .env fehlt: ${fehlend.join(', ')}\n` +
      '     Vorlage: .env.example kopieren und in .env umbenennen.',
  );
}

// --- Upload -------------------------------------------------------------

const client = new Client(30_000);
client.ftp.verbose = false;

let hochgeladen = 0;

client.trackProgress((info) => {
  if (info.type === 'upload' && info.name) {
    hochgeladen += 1;
    console.log(`     ${String(hochgeladen).padStart(3, ' ')}  ${info.name}`);
  }
});

console.log(`\n  Verbinde mit ${FTP_SERVER} …`);

try {
  await client.access({
    host: FTP_SERVER,
    user: FTP_USERNAME,
    password: FTP_PASSWORD,
    secure: FTP_SECURE !== 'false',
    secureOptions: { rejectUnauthorized: false },
  });

  console.log(`  Verbunden. Zielverzeichnis: ${FTP_DIR}\n`);

  await client.ensureDir(FTP_DIR);
  await client.uploadFromDir(DIST, FTP_DIR);

  console.log(`\n  ✔  Fertig – ${hochgeladen} Dateien hochgeladen.\n`);
} catch (error) {
  console.error(`\n  ✖  Upload fehlgeschlagen: ${error.message}`);

  if (/timeout/i.test(error.message)) {
    console.error(
      '     Der Server antwortet nicht. Stimmt FTP_SERVER? Blockiert eine\n' +
        '     Firewall Port 21?',
    );
  }

  if (/530|login|credential/i.test(error.message)) {
    console.error('     Benutzername oder Passwort werden abgelehnt.');
  }

  if (/certificate|self.signed|TLS/i.test(error.message)) {
    console.error('     TLS-Problem – zum Testen FTP_SECURE=false in .env setzen.');
  }

  process.exitCode = 1;
} finally {
  client.close();
}
