import { href } from '../router';

export function Home() {
  return (
    <div class="page">
      <section class="hero">
        <h1>Study Hub</h1>
        <p class="lead">
          Formelsammlungen, Probeprüfungen und alte Prüfungen, geordnet nach Studiengang, Semester und Modul.
          Von Studierenden für Studierende: Wer mit alten Prüfungen lernt, lernt auf dem richtigen Niveau.
        </p>
        <p><a class="btn btn-primary" href={href('/ablage')}>Zur Ablage</a></p>
      </section>

      <section class="cards">
        <a class="card card-link" href={href('/ablage')}>
          <h2>Ablage</h2>
          <p>Prüfungen, Probeprüfungen, Lösungen und Formelsammlungen ansehen und hochladen.
            Anmelden mit der Mail-Adresse für Studierende der Hochschule.</p>
        </a>
        <div class="card card-muted">
          <h2>Formelbuch <span class="chip">kommt später</span></h2>
          <p>Vernetzte Formeln mit Grundlagen, Analogien, Simulationen und einer Formelsammlung zum Drucken.</p>
        </div>
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
