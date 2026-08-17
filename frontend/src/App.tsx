const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
const appVersion = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

export function App() {
  return (
    <main className="app">
      <header className="hero">
        <p className="brand">Ecommerce App New</p>
        <h1>Shop that scales with you</h1>
        <p className="lede">
          Browse products, build a cart, and check out — powered by a containerized
          staging pipeline.
        </p>
      </header>
      <section className="meta" aria-label="Build metadata">
        <p>API base: {apiBase}</p>
        <p>Build: {appVersion}</p>
      </section>
    </main>
  );
}
