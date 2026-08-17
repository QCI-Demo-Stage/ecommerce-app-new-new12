const apiBase = import.meta.env.VITE_API_BASE_URL ?? "/api";
const appVersion = import.meta.env.VITE_APP_VERSION ?? "0.0.0";

export default function App() {
  return (
    <main className="app">
      <h1>Ecommerce App New</h1>
      <p>Browse products, manage your cart, and complete purchases.</p>
      <p className="meta">
        API: {apiBase} · v{appVersion}
      </p>
    </main>
  );
}
