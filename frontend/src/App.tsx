const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";

export function App() {
  return (
    <main className="app">
      <h1>Ecommerce App New</h1>
      <p>Browse products, manage your cart, and checkout securely.</p>
      <p className="meta">API base: {apiBase}</p>
    </main>
  );
}
