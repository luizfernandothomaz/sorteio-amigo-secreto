import { useEffect, useState } from "react";
import { call, useEmailEnabled, type GroupInput } from "../api";
import { Brand, IconNoHeart, IconPlus, IconX } from "../components";

type Person = { name: string; email: string };
type Pair = { a: string; b: string };
type Draft = { name: string; people: Person[]; pairs: Pair[]; organizerSeesResult: boolean };

const DRAFT_KEY = "amigo-secreto-rascunho";
const emptyDraft = (): Draft => ({
  name: "Amigo Secreto de Natal",
  people: [
    { name: "", email: "" },
    { name: "", email: "" },
    { name: "", email: "" },
  ],
  pairs: [],
  organizerSeesResult: true,
});

/** Rascunho guardado só nesta aba (sessionStorage): sobrevive ao voltar e ao recarregar, e some ao fechar a aba. */
function loadDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (raw) {
      const d = JSON.parse(raw) as Partial<Draft>;
      if (typeof d.name === "string" && Array.isArray(d.people) && d.people.length > 0 && Array.isArray(d.pairs)) {
        return { ...emptyDraft(), ...d } as Draft;
      }
    }
  } catch {
    /* sem storage ou rascunho inválido: começa vazio */
  }
  return emptyDraft();
}

export function CreateGroup() {
  const [initial] = useState(loadDraft);
  const [name, setName] = useState(initial.name);
  const [people, setPeople] = useState<Person[]>(initial.people);
  const [pairs, setPairs] = useState<Pair[]>(initial.pairs);
  const [organizerSeesResult, setOrganizerSeesResult] = useState(initial.organizerSeesResult);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, people, pairs, organizerSeesResult }));
    } catch {
      /* ignora: o formulário funciona sem rascunho */
    }
  }, [name, people, pairs, organizerSeesResult]);

  function clearForm() {
    const d = emptyDraft();
    setName(d.name);
    setPeople(d.people);
    setPairs(d.pairs);
    setOrganizerSeesResult(d.organizerSeesResult);
    setError("");
  }

  const emailEnabled = useEmailEnabled();
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
        <button className="link" onClick={clearForm}>Limpar formulário</button>
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
        <p className="muted">{emailEnabled ? "E-mail é opcional. Quem não tiver recebe o link pelo WhatsApp." : "Cada pessoa recebe um link para abrir no celular. Você envia pelo WhatsApp."}</p>
        {people.map((p, i) => (
          <div className="item" key={i}>
            <span className="num">{i + 1}</span>
            <div className="fields">
              <input aria-label="Nome" placeholder="Nome" value={p.name} onChange={(e) => setPerson(i, { name: e.target.value })} />
              {emailEnabled && <input aria-label="E-mail" placeholder="E-mail (opcional)" type="email" value={p.email} onChange={(e) => setPerson(i, { email: e.target.value })} />}
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
