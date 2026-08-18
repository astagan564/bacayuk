import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import App from '@/App';

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: () => (
    <main className="min-h-screen grid place-items-center bg-surface px-6 text-center">
      <div>
        <p className="text-sm font-bold text-secondary">404</p>
        <h1 className="mt-2 text-2xl font-black text-primary">Halaman tidak ditemukan</h1>
        <a className="btn-primary mt-5 inline-flex rounded-xl px-4 py-2 text-sm font-bold" href="/">
          Kembali ke beranda
        </a>
      </div>
    </main>
  ),
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <App />
      <Scripts />
    </>
  );
}
