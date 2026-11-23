import { useState } from "react";
import { call, type GroupInput } from "../api";
import { Brand, IconNoHeart, IconPlus, IconX } from "../components";

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

  const missing = 3 - names.length;
  const disabled = busy || missing > 0;

  return (
    <>
      <nav className="nav"><Brand /></nav>

      <div className="pagehead">
        <h1>Criar grupo</h1>
        <p className="muted">Crie o grupo, sorteie e mande um link para cada pessoa.</p>
      </div>

      <section className="card">
        <label>
          Nome do grupo
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
      </section>

      <section className="card">
        <div className="head">
          <h2>Participantes</h2>
          <span className="pill">{names.length === 1 ? "1 pessoa" : `${names.length} pessoas`}</span>
        </div>
        <p className="muted">E-mail é opcional. Quem não tiver recebe o link pelo WhatsApp.</p>
        {people.map((p, i) => (
          <div className="item" key={i}>
            <span className="num">{i + 1}</span>
            <div className="fields">
              <input aria-label="Nome" placeholder="Nome" value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} />
              <input aria-label="E-mail" placeholder="E-mail (opcional)" type="email" value={p.email} onChange={(e) => setPerson(i, { email: e.target.value })} />
            </div>
            <button className="icon" aria-label="Remover participante" onClick={() => setPeople(people.filter((_, idx) => idx !== i))}><IconX /></button>
          </div>
        ))}
        <button className="add" onClick={() => setPeople([...people, { name: "", email: "" }])}><IconPlus /> Participante</button>
      </section>

      <section className="card">
        <h2>Pares proibidos</h2>
        <p className="muted">Ex.: casais. Vale nos dois sentidos: um não tira o outro.</p>
        {pairs.map((p, i) => (
          <div className="item" key={i}>
            <div className="fields">
              <select aria-label="Pessoa A" value={p.a} onChange={(e) => setPair(i, { a: e.target.value })}>
                <option value="">Escolha…</option>
                {names.map((n) => <option key={n}>{n}</option>)}
              </select>
              <span className="sep"><IconNoHeart /></span>
              <select aria-label="Pessoa B" value={p.b} onChange={(e) => setPair(i, { b: e.target.value })}>
                <option value="">Escolha…</option>
                {names.filter((n) => n !== p.a).map((n) => <option key={n}>{n}</option>)}
              </select>
            </div>
            <button className="icon" aria-label="Remover par" onClick={() => setPairs(pairs.filter((_, idx) => idx !== i))}><IconX /></button>
          </div>
        ))}
        <button className="add" onClick={() => setPairs([...pairs, { a: "", b: "" }])} disabled={names.length < 2}><IconPlus /> Par proibido</button>
        {names.length < 2 && <p className="hint">Preencha pelo menos 2 nomes para criar um par.</p>}
      </section>

      <section className="card flush">
        <button className="switch" role="switch" aria-checked={organizerSeesResult} onClick={() => setOrganizerSeesResult(!organizerSeesResult)}>
          <span className="txt">
            <b>Eu, organizador, posso ver o resultado</b>
            <span>{organizerSeesResult ? "Útil se alguém perder o link." : "Ninguém além de cada participante sabe quem tirou quem."}</span>
          </span>
          <span className="track" />
        </button>
      </section>

      {error && <p className="error">{error}</p>}
      <div className="sticky">
        <button className="primary" onClick={submit} disabled={disabled}>{busy ? "Criando..." : "Criar grupo"}</button>
        {missing > 0 && <span className="hint">Faltam {missing} {missing === 1 ? "participante" : "participantes"} para sortear.</span>}
      </div>
    </>
  );
}
