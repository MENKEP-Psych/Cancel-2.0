# Cancel 2.0

Digitales Auswertungstool für Neglect-Durchstreichaufgaben (Cancellation Tasks). Entwickelt für den klinischen Einsatz in der Neuropsychologie.

Die App läuft als einzelne HTML-Datei direkt im Browser. Eigene JPEG können von Tests hochgeladen werden und mit targets (und Distraktoren) markiert werden - Danach geschieht die Berechnung automatisch. 
Tipp: Kennwerte des jeweiligen Testblattes/Tests in der Normierung nachsehen. 

---

## Kennwerte

**CoC – Coefficient of Concentration (horizontal)**
Misst, ob ein Patient systematisch eine Seite des Blattes bevorzugt. Ein Wert nahe 0 bedeutet gleichmäßige Verteilung, negative Werte zeigen eine Tendenz nach links, positive nach rechts. Auffällig außerhalb des konfigurierten Normbereichs.

**CoC – Coefficient of Concentration (vertikal)**
Dasselbe Prinzip wie der horizontale CoC, aber für die vertikale Achse (oben/unten).

**Auslassungen links / rechts**
Anzahl der Targets, die der Patient in der linken bzw. rechten Bildhälfte nicht angekreuzt hat. Die Grenze zwischen beiden Hälften liegt beim geometrischen Mittelpunkt aller Targets. Hohe Auslassungen auf einer Seite sind ein klassisches Neglect-Zeichen.

**Chi² p-Wert**
Statistischer Test (Yates-korrigierter Chi-Quadrat-Test), der prüft, ob die Verteilung der Treffer zwischen linker und rechter Seite zufällig ist oder eine signifikante Asymmetrie vorliegt. p < 0,05 gilt als statistisch signifikant.

**a-Index – Allocentrischer Index**
Misst objektbezogene (allocentrische) Vernachlässigung anhand von Items mit einseitigen Defektmerkmalen. Unabhängig davon, wo das Item auf dem Blatt liegt – es geht darum, ob der Patient die defekte Seite des Objekts selbst übersieht. Positive Werte deuten auf links-allocentrische, negative auf rechts-allocentrische Vernachlässigung hin.

**Distraktoren**
Items, die der Patient nicht ankreuzen soll. Jede Markierung eines Distraktors zählt als Fehler (falsch-positiv). Gibt Hinweise auf Impulsivität oder eingeschränkte Selektivität.

**Perseverationen**
Mehrfaches Ankreuzen desselben Items. Wird manuell erfasst und dokumentiert.

---

## Target-Typen

- **Normal** – Reguläre Targets, die angekreuzt werden sollen
- **Defekt L / Defekt R** – Items mit einem einseitigen Defekt (links oder rechts), für die allocentrische Auswertung
- **Distraktor** – Items, die nicht angekreuzt werden sollen

---

## Verwendung

### Klinik (HTML-Datei)

`docs/index.html` herunterladen und im Browser öffnen.

### Lokal entwickeln

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

Erzeugt `docs/index.html` als einzelne, vollständige Datei.

---

## Testdateien

Testdateien werden als `.json` gespeichert und enthalten Testbild, Target-Positionen, Typen und diagnostische Grenzwerte. Sie können zwischen Geräten geteilt und wiederverwendet werden.

---

*Nur zur Verwendung durch geschultes Fachpersonal. Kein Ersatz für fachärztliche Beurteilung.*
