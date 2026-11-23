import { useState } from "react";
import { call, deviceId } from "../api";

type Result = { group: string; name: string; receiver: string };

export function Reveal({ token }: { token: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function reveal() {
    setBusy(true);
    setError("");
    try {
      setResult(await call<Result>("POST", `/api/reveal/${token}`, { deviceId: deviceId() }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (result)
    return (
      <section className="card reveal">
        <p className="muted">{result.group}</p>
        <h2>{result.name}, você tirou:</h2>
        <p className="big">{result.receiver}</p>
        <p className="muted small">Guarde segredo! 🤫 Você pode reabrir este link neste aparelho.</p>
      </section>
    );

  return (
    <section className="card reveal">
      <h1>🎁</h1>
      <h2>Seu amigo secreto</h2>
      <p className="muted">Abra só no seu celular. O link fica preso ao primeiro aparelho que abrir.</p>
      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={reveal} disabled={busy}>{busy ? "Abrindo..." : "Revelar"}</button>
    </section>
  );
}
