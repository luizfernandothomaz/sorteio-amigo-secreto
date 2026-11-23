import { useState } from "react";
import { call, type GroupInput } from "../api";

type Person = { name: string; email: string };
type Pair = { a: string; b: string };

export function CreateGroup() {
  const [name, setName] = useState("Amigo Secreto de Natal");
  const [people, setPeople] = useState<Person[]>([
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [organizerSeesResult, setOrganizerSeesResult] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const names = people.map((p) => p.name.trim()).filter(Boolean);

  const setPerson = (i: number, patch: Partial<Person>) =>
    setPeople(people.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const setPair = (i: number, patch: Partial<Pair>) =>
    setPairs(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  async function submit() {
    setError("");
    setBusy(true);
    try {
      const input: GroupInput = {
        name,
        organizerSeesResult,
        participants: people
          .filter((p) => p.name.trim())
          .map((p) => ({ name: p.name.trim(), email: p.email.trim() || null })),
        restrictions: pairs.filter((p) => p.a && p.b),
      };
      const { id, adminKey } = await call<{ id: string; adminKey: string }>("POST", "/api/groups", input);
      window.location.href = `/g/${id}?key=${adminKey}`;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <>
      <h1>🎁 Amigo Secreto</h1>
      <p className="muted">Crie o grupo, sorteie e mande um link para cada pessoa.</p>

      <section className="card">
        <label>
          Nome do grupo
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </section>

      <section className="card">
        <h2>Participantes ({names.length})</h2>
        <p className="muted">E-mail é opcional. Quem não tiver recebe o link pelo WhatsApp.</p>
        {people.map((p, i) => (
          <div className="row" key={i}>
            <input placeholder="Nome" value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} />
            <input placeholder="E-mail (opcional)" type="email" value={p.email} onChange={(e) => setPerson(i, { email: e.target.value })} />
            <button className="icon" title="Remover" onClick={() => setPeople(people.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <button className="secondary" onClick={() => setPeople([...people, { name: "", email: "" }])}>+ Participante</button>
      </section>

      <section className="card">
        <h2>Pares proibidos</h2>
        <p className="muted">Ex.: casais. Vale nos dois sentidos: um não tira o outro.</p>
        {pairs.map((p, i) => (
          <div className="row" key={i}>
            <select value={p.a} onChange={(e) => setPair(i, { a: e.target.value })}>
              <option value="">Escolha</option>
              {names.map((n) => <option key={n}>{n}</option>)}
            </select>
            <span>↔</span>
            <select value={p.b} onChange={(e) => setPair(i, { b: e.target.value })}>
              <option value="">Escolha</option>
              {names.filter((n) => n !== p.a).map((n) => <option key={n}>{n}</option>)}
            </select>
            <button className="icon" title="Remover" onClick={() => setPairs(pairs.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
        <button className="secondary" onClick={() => setPairs([...pairs, { a: "", b: "" }])} disabled={names.length < 2}>
          + Par proibido
        </button>
      </section>

      <section className="card">
        <label className="check">
          <input type="checkbox" checked={organizerSeesResult} onChange={(e) => setOrganizerSeesResult(e.target.checked)} />
          Eu, organizador, posso ver o resultado
        </label>
      </section>

      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={submit} disabled={busy}>{busy ? "Criando..." : "Criar grupo"}</button>
    </>
  );
}
