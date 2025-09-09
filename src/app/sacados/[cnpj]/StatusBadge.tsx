"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type S = { id: string; nome: string; cor: string | null };

export default function StatusBadge({ statusId }: { statusId?: string | null }) {
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    if (!statusId) { setS(null); return; }
    supabase
      .from('sacado_statuses')
      .select('id, nome, cor')
      .eq('id', statusId)
      .maybeSingle()
      .then(({ data }) => setS((data as S) ?? null));
  }, [statusId]);

  if (!s) return null;
  const bg = s.cor ?? '#cdb89a';
  const color = '#0f172a';
  return (
    <span className="inline-flex items-center gap-2 px-2 h-7 rounded-full border" style={{ background: bg, color }}>
      <span className="inline-block w-2 h-2 rounded-full border" style={{ background: color }} />
      <span className="text-sm">{s.nome}</span>
    </span>
  );
}


