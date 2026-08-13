import StoriesStrip from './StoriesStrip';
import StatCards from './StatCards';
import Notebook from './Notebook';
import StudyEntry from './StudyEntry';
import Collection from './Collection';

export default function VaultView() {
  return (
    <section className="pt-2" aria-labelledby="vault-title">
      <StoriesStrip />
      <div className="pt-7">
        <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">Vault Overview</p>
        <h1 id="vault-title" className="display-face m-0 mt-2 leading-tight">
          Study Vault
        </h1>
        <p className="mt-2 max-w-xl leading-relaxed">Track tasks, notes, and progress from one dashboard.</p>
      </div>
      <StatCards />
      <Notebook />
      <div className="mt-6 grid gap-6 lg:grid-cols-[.82fr_1.18fr]">
        <StudyEntry />
        <Collection />
      </div>
    </section>
  );
}
