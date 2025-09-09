export default function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-10 bg-white">
      <div className="container h-16 flex items-center justify-between text-sm text-slate-600">
        <span className="font-medium text-slate-800">Reversa</span>
        <span className="text-slate-500">{new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}


