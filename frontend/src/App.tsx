export function App() {
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";

  return (
    <main className="app">
      <h1>Ecommerce App New</h1>
      <p>Browse products, manage your cart, and check out securely.</p>
      <p className="meta">API: {apiBase}</p>
    </main>
  );
}
