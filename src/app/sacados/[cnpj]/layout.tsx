export default function SacadoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen p-6">
      <div className="container max-w-5xl space-y-6">
        {children}
      </div>
    </main>
  );
}
