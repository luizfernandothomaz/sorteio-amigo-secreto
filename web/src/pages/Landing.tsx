import { Brand } from "../components";

const steps = [
  { t: "Cadastre o grupo", d: "Coloque os nomes e marque quem não pode se tirar, como casais." },
  { t: "Sorteie e envie", d: "Um clique sorteia e gera um link único para cada pessoa." },
  { t: "Cada um revela o seu", d: "Cada pessoa abre o próprio link no celular e descobre quem tirou." },
];

const features = [
  { i: "💑", t: "Pares proibidos", d: "Casais e família não se tiram, nos dois sentidos." },
  { i: "🔒", t: "Link de visualização única", d: "Cada link fica preso ao primeiro aparelho que abrir." },
  { i: "💬", t: "WhatsApp ou e-mail", d: "Mensagem pronta para enviar a quem não tem e-mail." },
  { i: "👀", t: "Quem já viu", d: "Acompanhe o contador “X de N já viram” no painel." },
];

export function Landing() {
  return (
    <div className="wide">
      <nav className="nav">
        <Brand />
        <a className="btn secondary" href="/novo">Criar grupo</a>
      </nav>

      <header className="hero">
        <div className="stack">
          <span className="eyebrow">Grátis · sem cadastro</span>
          <h1>Amigo secreto sem confusão.</h1>
          <p className="lead">
            Crie o grupo, sorteie e mande um link para cada pessoa. Ninguém tira a si mesmo, casais ficam
            separados e só você decide quem vê o quê.
          </p>
          <div className="cta">
            <a className="btn primary" href="/novo">Criar meu grupo</a>
            <span className="muted small">Leva menos de 2 minutos.</span>
          </div>
        </div>
        <div className="ticket" aria-hidden="true">
          <div className="gift">🎁</div>
          <p className="muted">Você tirou…</p>
          <p className="who">???</p>
          <p className="muted small">Guarde segredo! 🤫</p>
        </div>
      </header>

      <section className="section">
        <h2>Como funciona</h2>
        <div className="grid3">
          {steps.map((s, i) => (
            <div className="card step" key={s.t}>
              <span className="n">{i + 1}</span>
              <h3>{s.t}</h3>
              <p className="muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>Feito para a família toda</h2>
        <div className="grid4">
          {features.map((f) => (
            <div className="card feat" key={f.t}>
              <span className="ico">{f.i}</span>
              <h3>{f.t}</h3>
              <p className="muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="band">
          <h2>Pronto para sortear?</h2>
          <p>O organizador pode ou não ver o resultado. Você escolhe ao criar o grupo.</p>
          <a className="btn primary" href="/novo">Criar meu grupo</a>
        </div>
      </section>

      <footer className="footer">Amigo Secreto · Licença MIT</footer>
    </div>
  );
}
