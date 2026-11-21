import { href } from '../router';

export function Home() {
  return (
    <div class="page">
      <section class="hero">
        <h1>Study Hub</h1>
        <p class="lead">
          Ein Formelbuch mit Erklärungen und Formelsammlungen zum Drucken. Dazu eine Ablage für Formelsammlungen,
          Probeprüfungen und alte Prüfungen: Wer mit alten Prüfungen lernt, lernt auf dem richtigen Niveau.
        </p>
        <p class="link-row">
          <a class="btn btn-primary" href={href('/explorer')}>Zum Formelbuch</a>
          <a class="btn" href={href('/ablage')}>Zur Ablage</a>
        </p>
      </section>

      <section class="cards">
        <a class="card card-link" href={href('/ablage')}>
          <h2>Ablage</h2>
          <p>Prüfungen, Probeprüfungen, Lösungen und Formelsammlungen ansehen und hochladen.
            Anmelden mit der Mail-Adresse für Studierende der Hochschule.</p>
        </a>
        <a class="card card-link" href={href('/explorer')}>
          <h2>Formelbuch</h2>
          <p>Formeln mit Erklärung, Gültigkeit, Beispiel und Lösung, vernetzt über Voraussetzungen und Analogien.
            Ohne Login und auch offline.</p>
        </a>
        <a class="card card-link" href={href('/pruefung')}>
          <h2>Formelsammlung drucken</h2>
          <p>Pro Modul oder mit eigener Auswahl, auf A4 in zwei oder drei Spalten.</p>
        </a>
      </section>

      <section class="card">
        <h2>So funktioniert die Ablage</h2>
        <ol class="steps">
          <li>Mit der Mail-Adresse der Hochschule anmelden: Du bekommst einen Code per Mail.</li>
          <li>Die Nutzungsregeln lesen und annehmen.</li>
          <li>Studiengang, Semester und Modul wählen und die Dokumente direkt im Browser ansehen.</li>
          <li>Eigene Formelsammlungen oder alte Prüfungen hochladen. Die Moderation prüft sie, danach sind sie für alle sichtbar,
            mit Quelle und Wasserzeichen.</li>
        </ol>
        <p class="muted small">Unterrichtsunterlagen (Skripte, Folien, Übungsblätter) gehören nicht in die Ablage.</p>
      </section>
    </div>
  );
}
