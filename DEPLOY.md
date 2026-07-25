# Deployment – EA-Außenpflege auf STRATO

Die Seite ist eine statische Astro-Seite. Auf dem STRATO-Webspace läuft kein
Node.js – das ist auch nicht nötig: Gebaut wird vorher, auf den Server kommt
nur fertiges HTML.

Domain: **https://ea-gartenbau.de** (eingetragen in `astro.config.mjs`)

---

## Variante A – Automatisch bei jedem Push (eingerichtet)

Der Workflow `.github/workflows/deploy.yml` baut die Seite und lädt sie per FTP
hoch, sobald etwas auf `main` gepusht wird.

### Einmalige Einrichtung

1. Im **STRATO-Kundenlogin** unter der Paketverwaltung einen FTP-Zugang öffnen
   bzw. ein FTP-Passwort setzen. Notiere Server, Benutzername und Passwort.
2. Auf GitHub im Repository:
   **Settings → Secrets and variables → Actions → New repository secret**

   | Secret | Beispielwert |
   | --- | --- |
   | `FTP_SERVER` | `ftp.strato.de` |
   | `FTP_USERNAME` | dein STRATO-FTP-Benutzername |
   | `FTP_PASSWORD` | dein STRATO-FTP-Passwort |

3. Prüfen, ob die Domain im Wurzelverzeichnis liegt. Falls nicht, in
   `deploy.yml` bei `server-dir` den passenden Unterordner eintragen.

### Danach

Jeder Push auf `main` deployt automatisch. Der Fortschritt steht auf GitHub
unter **Actions**. Manuell auslösen geht dort ebenfalls über *Run workflow*.

Beim ersten Lauf lädt die Action alles hoch, danach nur noch geänderte Dateien.
Dafür legt sie auf dem Server die Datei `.ftp-deploy-sync-state.json` an – die
gehört dorthin und darf nicht gelöscht werden.

---

## Variante B – Manuell per FTP

```bash
npm run build
```

Anschließend mit einem FTP-Programm (z. B. FileZilla) den **Inhalt** von `dist/`
in das Zielverzeichnis der Domain hochladen – nicht den Ordner `dist` selbst.

Versteckte Dateien im FTP-Programm einblenden, sonst fehlt die `.htaccess`.

---

## HTTPS

1. Im STRATO-Kundenlogin das SSL-Zertifikat für die Domain aktivieren.
2. Warten, bis `https://ea-gartenbau.de` im Browser funktioniert.
3. Erst dann in `public/.htaccess` den HTTPS-Block entkommentieren und neu
   deployen. Vorher führt die Weiterleitung ins Leere.

---

## Vor dem Livegang noch offen

- **Impressum und Datenschutzerklärung** enthalten nur „Inhalt folgt“ – bei
  einer gewerblichen Seite in Deutschland sind beide Pflicht.
- **Platzhalter-Texte** ersetzen: „Musterstadt“, Telefonnummer `0123 456 78 90`,
  Adresse, E-Mail, Gründungsjahr, Kennzahlen und Testimonials.
- **Bilder** in `public/images/` sind CC-lizenzierte Beispielbilder mit kleinem
  Wasserzeichen. Für die Live-Seite durch eigene Fotos ersetzen – die
  Dateinamen können 1:1 beibehalten werden, dann ist keine Codeänderung nötig.
