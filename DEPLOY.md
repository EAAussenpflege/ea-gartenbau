# Deployment – EA-Außenpflege auf Hostinger

Die Seite ist eine statische Astro-Seite. Auf dem Hostinger-Webspace läuft kein
Node.js – das ist auch nicht nötig: Gebaut wird vorher, auf den Server kommt
nur fertiges HTML.

Domain: **https://ea-gartenbau-pflege.de** (eingetragen in `astro.config.mjs`)
Zielverzeichnis auf dem Server: **`public_html`**

---

## Wichtig: Warum die Git-Funktion von Hostinger nicht reicht

Hostinger kopiert bei der Git-Verbindung den **Repository-Inhalt** nach
`public_html`, führt aber **keinen Build aus**. Im Repository liegen nur die
Quelldateien (`src/`, `package.json`); die fertige Website entsteht erst durch
`npm run build` im Ordner `dist/`, der bewusst nicht eingecheckt ist.

Deshalb wird über FTP deployt – entweder automatisch über GitHub Actions oder
mit einem Befehl vom eigenen Rechner.

---

## Zugangsdaten holen

Im **hPanel** unter **Dateien → FTP-Konten**. Dort stehen:

- FTP-Host (z. B. eine IP-Adresse oder `ftp.ea-gartenbau-pflege.de`)
- FTP-Benutzername (Format `u123456789.ea-gartenbau-pflege.de`)
- Passwort – falls unbekannt, dort neu setzen

---

## Variante A – Ein Befehl vom eigenen Rechner

### Einmalig

Die Werte in die Datei `.env` im Projektordner eintragen (Vorlage:
`.env.example`). Diese Datei ist über `.gitignore` ausgeschlossen und landet
nie auf GitHub – Zugangsdaten gehören ausschließlich dorthin.

### Deployen

```bash
npm run deploy
```

Baut die Seite neu und lädt alles aus `dist/` nach `public_html`. Jede
übertragene Datei wird einzeln aufgelistet.

Falls PowerShell die Ausführung blockiert, stattdessen `npm.cmd run deploy`
verwenden.

---

## Variante B – Automatisch bei jedem Push

Der Workflow `.github/workflows/deploy.yml` baut die Seite und lädt sie hoch,
sobald etwas auf `main` gepusht wird.

Dafür auf GitHub unter **Settings → Secrets and variables → Actions** drei
Secrets anlegen – dieselben Werte wie in der `.env`:

| Secret | Inhalt |
| --- | --- |
| `FTP_SERVER` | FTP-Host aus dem hPanel |
| `FTP_USERNAME` | FTP-Benutzername aus dem hPanel |
| `FTP_PASSWORD` | FTP-Passwort |

Der Fortschritt steht auf GitHub unter **Actions**.

Beim ersten Lauf lädt die Action alles hoch, danach nur noch geänderte Dateien.
Dafür legt sie auf dem Server die Datei `.ftp-deploy-sync-state.json` an – die
gehört dorthin und darf nicht gelöscht werden.

---

## HTTPS

Hostinger stellt das SSL-Zertifikat automatisch aus. Sobald
`https://ea-gartenbau-pflege.de` im Browser funktioniert, in `public/.htaccess`
den HTTPS-Block entkommentieren und neu deployen.

---

## Vor dem Livegang noch offen

- **Impressum und Datenschutzerklärung** enthalten nur „Inhalt folgt“ – bei
  einer gewerblichen Seite in Deutschland sind beide Pflicht.
- **Kontaktseite** ist noch leer, obwohl alle Buttons dorthin führen.
- **Kundenstimmen** sind ausgeblendet, bis echte Google-Bewertungen in
  `src/pages/index.astro` eingetragen sind.
- **Bilder** in `public/images/` sind CC-lizenzierte Beispielbilder mit kleinem
  Wasserzeichen. Für die Live-Seite durch eigene Fotos ersetzen – die
  Dateinamen können 1:1 beibehalten werden, dann ist keine Codeänderung nötig.
