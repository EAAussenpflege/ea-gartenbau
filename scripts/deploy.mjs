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

// Mit FTP_DEBUG=true wird der komplette FTP-Dialog mitgeschrieben.
client.ftp.verbose = process.env.FTP_DEBUG === 'true';

let hochgeladen = 0;
let phase = 'Verbindungsaufbau';

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

  console.log('  Angemeldet.');

  // FTP_SECURE=control: Anmeldung verschlüsselt, Dateien im Klartext.
  // Nötig bei Servern, die PROT P nicht unterstützen (Antwort 504).
  if (FTP_SECURE === 'control') {
    phase = 'Umschalten auf unverschlüsselten Datenkanal';
    await client.send('PROT C');
    console.log('  Datenkanal auf unverschlüsselt umgestellt.');
  }

  // Je nachdem, wie das FTP-Konto eingerichtet ist, landet man nach dem
  // Login entweder im Home-Verzeichnis (dann muss nach public_html
  // gewechselt werden) oder bereits direkt darin. Beides wird abgedeckt.
  phase = 'Zielverzeichnis bestimmen';

  try {
    await client.cd(FTP_DIR);
  } catch {
    const eintraege = await client.list();
    const hatPublicHtml = eintraege.some(
      (eintrag) => eintrag.isDirectory && eintrag.name === 'public_html',
    );

    if (hatPublicHtml) {
      await client.cd('public_html');
    } else {
      console.log(`  Hinweis: ${FTP_DIR} existiert nicht – lade ins aktuelle Verzeichnis.`);
    }
  }

  console.log(`  Zielverzeichnis: ${await client.pwd()}\n`);

  phase = 'Dateiübertragung';
  await client.uploadFromDir(DIST);

  console.log(`\n  ✔  Fertig – ${hochgeladen} Dateien hochgeladen.\n`);
} catch (error) {
  console.error(`\n  ✖  Fehlgeschlagen bei: ${phase}`);
  console.error(`     ${error.message}\n`);

  if (/timeout/i.test(error.message)) {
    console.error(
      '     Der Server antwortet nicht. Stimmt FTP_SERVER? Blockiert eine\n' +
        '     Firewall Port 21?',
    );
  }

  if (/530|login|credential|password/i.test(error.message)) {
    console.error('     Benutzername oder Passwort werden abgelehnt.');
  }

  if (/504|PROT|PBSZ/i.test(error.message)) {
    console.error(
      '     STRATO lehnt den verschlüsselten Datenkanal ab.\n' +
        '     Setze in der .env FTP_SECURE=false und versuche es erneut.',
    );
  }

  if (/certificate|self.signed|TLS|SSL/i.test(error.message)) {
    console.error('     TLS-Problem – zum Testen FTP_SECURE=false in .env setzen.');
  }

  console.error(
    '\n     Für den vollständigen Protokollverlauf:\n' +
      '     $env:FTP_DEBUG="true"; npm.cmd run deploy\n',
  );

  process.exitCode = 1;
} finally {
  client.close();
}
