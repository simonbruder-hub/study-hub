import { useState } from 'preact/hooks';
import { api, loadAccount, me } from './state';
import { ErrorNote, useAction } from './ui';

export function RulesText() {
  return (
    <ol class="steps">
      <li>Die Ablage ist von Studierenden für Studierende, unabhängig von der Hochschule und den Studiengangleitungen.</li>
      <li>Hinein gehören Formelsammlungen, Probeprüfungen, alte Prüfungen und Lösungen. Unterrichtsunterlagen (Skripte, Folien,
        Übungsblätter) gehören nicht hinein.</li>
      <li>Prüfungen sind Werke der Dozentinnen und Dozenten. Alles hier ist nur zum eigenen Lernen da: nicht weitergeben, nicht
        veröffentlichen, nicht verkaufen.</li>
      <li>Lade nur hoch, was du selbst bekommen oder selbst erstellt hast, und gib Modul, Semester und Verfasser so genau wie möglich an.
        Jedes Dokument zeigt seine Quelle.</li>
      <li>Die Moderation prüft jeden Upload und kann Dokumente jederzeit entfernen. Mit «Melden» weist du auf Probleme hin, zum Beispiel
        wenn eine Dozentin oder ein Dozent ein Dokument nicht in der Ablage haben will.</li>
      <li>Abrufe werden protokolliert und begrenzt, damit niemand die Ablage automatisch kopiert. Jede Seite trägt eine Fusszeile mit
        der Quelle.</li>
      <li>Wer hochlädt, bleibt für die anderen Studierenden unsichtbar. Nur die Moderation sieht, von wem ein Upload stammt.</li>
      <li>Wer gegen die Regeln verstösst, kann gesperrt werden.</li>
    </ol>
  );
}

/** Nutzungsregeln; beim ersten Besuch mit «Annehmen» */
export function Rules() {
  const accepted = me.value?.rules_accepted ?? false;
  const [ok, setOk] = useState(false);
  const act = useAction();
  return (
    <div class="page">
      <h1>Nutzungsregeln</h1>
      <section class="card stack">
        <RulesText />
        {!accepted && (
          <form class="stack" onSubmit={(e) => {
            e.preventDefault();
            void act.run(async () => { await api.value!.acceptRules(); await loadAccount(); });
          }}>
            <label class="check">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.currentTarget.checked)} />
              <span>Ich halte mich an diese Regeln.</span>
            </label>
            <div class="row"><button class="btn btn-primary" disabled={!ok || act.busy}>Annehmen und weiter</button></div>
            <ErrorNote error={act.error} />
          </form>
        )}
      </section>
    </div>
  );
}
