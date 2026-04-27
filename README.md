# Cancel 2.0 – Neuropsychologische Diagnostik

Webbasiertes Auswertungstool für Neglect-Durchstreichaufgaben (Cancellation Tasks) in der klinischen Neuropsychologie. Läuft vollständig im Browser, ohne Installation, ohne Server, ohne Internetverbindung.

## Funktionen

- **Testdurchführung** — Digitale Durchführung von Cancellation Tasks mit beliebigem Testbild
- **Live-Auswertung** — Echtzeit-Berechnung aller relevanten Kennwerte während der Testdurchführung
- **Test-Editor** — Vollständiger Setup-Modus zum Erstellen und Bearbeiten von Testdateien inkl. Paint-Modus für Target-Zuweisung
- **PDF-Export** — Automatischer Export mit Testergebnis, Scan-Overlay und Ergebnistabelle
- **Portable** — Läuft als einzelne HTML-Datei in jedem modernen Browser

## Berechnete Kennwerte

| Kennwert | Beschreibung |
|---|---|
| **CoC (horizontal)** | Coefficient of Concentration – räumliche Tendenz links/rechts |
| **CoC (vertikal)** | Räumliche Tendenz oben/unten |
| **Auslassungen L/R** | Verpasste Targets je Bildhälfte |
| **Chi² p-Wert** | Statistischer Test auf hemisphärische Asymmetrie |
| **a-Index** | Allocentrischer Index (objektbezogene Vernachlässigung) |
| **Distraktoren** | Falsch-positive Markierungen |
| **Perseverationen** | Mehrfachmarkierungen |

## Target-Typen

- **Normal** — Reguläre Targets, die angekreuzt werden sollen
- **Defekt L / Defekt R** — Items mit einseitigen Merkmalsdefekten (für allocentrische Auswertung)
- **Distraktor** — Items, die nicht angekreuzt werden sollen (Fehlererfassung)

## Verwendung

### Als HTML-Datei (empfohlen für Klinik)

Die fertige App steht als einzelne Datei zur Verfügung:

```
docs/index.html
```

Datei herunterladen und in einem beliebigen Browser öffnen. Keine Installation erforderlich.

### Lokal entwickeln

```bash
npm install
npm run dev
```

### Build erstellen

```bash
npm run build
```

Erzeugt `docs/index.html` — eine vollständig selbstenthaltene HTML-Datei.

## Testdateien

Tests werden als `.json`-Dateien gespeichert und können zwischen Geräten geteilt werden. Die Datei enthält Testbild, Target-Positionen, Typen und diagnostische Grenzwerte.

## Technologie

React · TypeScript · Tailwind CSS · jsPDF · Vite

## Hinweis

Dieses Tool dient der Unterstützung klinischer Diagnostik und ersetzt keine fachärztliche Beurteilung. Nur zur Verwendung durch geschultes Fachpersonal.
