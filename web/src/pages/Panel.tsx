import { useCallback, useEffect, useState } from "react";
import { call, type GroupView, type ParticipantView } from "../api";

const time = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function Panel({ id, adminKey }: { id: string; adminKey: string }) {
  const [group, setGroup] = useState<GroupView | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = `/api/groups/${id}`;
  const q = `?key=${encodeURIComponent(adminKey)}`;

  const load = useCallback(async () => {
    try {
      setGroup(await call<GroupView>("GET", base + q));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [base, q]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  async function action(method: string, path: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const result = await call<any>(method, base + path + q);
      if (result.participants) setGroup(result);
      else await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmails() {
    const r = await action("POST", "/send-emails");
    if (r) setNotice(`${r.sent} e-mail(s) enviado(s).${r.failures.length ? " Falhas: " + r.failures.join(" | ") : ""}`);
  }

  if (!group) return error ? <p className="error">{error}</p> : <p>Carregando...</p>;

  const link = (p: ParticipantView) => `${location.origin}/r/${p.viewToken}`;
  const message = (p: ParticipantView) =>
    `Oi, ${p.name}! 🎁 O sorteio do ${group.name} foi feito. Abra no seu celular para ver quem você tirou: ${link(p)}`;

  return (
    <>
      <h1>🎁 {group.name}</h1>
      <p className="warn">Salve o link desta página: é a sua chave de organizador.</p>

      {!group.drawnAt ? (
        <section className="card">
          <h2>Participantes ({group.total})</h2>
          <ul>{group.participants.map((p) => <li key={p.id}>{p.name}{p.email && <span className="muted"> · {p.email}</span>}</li>)}</ul>
          {group.restrictions.length > 0 && (
            <>
              <h2>Pares proibidos</h2>
              <ul>{group.restrictions.map((r, i) => <li key={i}>{r.a} ↔ {r.b}</li>)}</ul>
            </>
          )}
          {error && <p className="error">{error}</p>}
          <button className="primary" disabled={busy} onClick={() => action("POST", "/draw")}>Sortear</button>
        </section>
      ) : (
        <>
          <section className="card counter">
            <strong>{group.viewedCount} de {group.total}</strong> já viram o resultado
          </section>

          <section className="card">
            <div className="row between">
              <h2>Links</h2>
              {group.organizerSeesResult && (
                <label className="check">
                  <input type="checkbox" checked={showResult} onChange={(e) => setShowResult(e.target.checked)} />
                  Mostrar resultado
                </label>
              )}
            </div>
            {group.participants.map((p) => (
              <div className="participant" key={p.id}>
                <div>
                  <strong>{p.name}</strong>
                  {showResult && p.assignedTo && <span className="result"> → {p.assignedTo}</span>}
                  <div className="muted small">
                    {p.viewedAt ? `✅ viu em ${time(p.viewedAt)}` : "⏳ ainda não viu"}
                    {p.email && (p.emailSentAt ? " · 📧 e-mail enviado" : " · 📧 e-mail pendente")}
                  </div>
                </div>
                <div className="actions">
                  <a className="btn whatsapp" href={`https://wa.me/?text=${encodeURIComponent(message(p))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                  <button className="secondary" onClick={() => { navigator.clipboard.writeText(link(p)); setNotice(`Link de ${p.name} copiado.`); }}>Copiar</button>
                  <button className="secondary" disabled={busy}
                    onClick={() => action("POST", `/participants/${p.id}/resend`, `Gerar link novo para ${p.name}? O link antigo para de funcionar.`)}>
                    Link novo
                  </button>
                </div>
              </div>
            ))}
          </section>

          {notice && <p className="notice">{notice}</p>}
          {error && <p className="error">{error}</p>}
          <div className="row">
            <button className="primary" disabled={busy} onClick={sendEmails}>Enviar e-mails</button>
            <button className="danger" disabled={busy}
              onClick={() => action("POST", "/draw", "Refazer o sorteio? Todos os links atuais deixam de funcionar.")}>
              Refazer sorteio
            </button>
          </div>
        </>
      )}
    </>
  );
}
