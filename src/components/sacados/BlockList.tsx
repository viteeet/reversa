"use client";

import { useMemo, useState } from "react";
import { formatCpfCnpj } from "@/lib/format";

export type Column = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "email" | "cpf" | "cnpj" | "select" | "date" | "textarea";
  options?: Array<{ label: string; value: string }>;
};

export type BlockListProps = {
  title: string;
  addLabel?: string;
  columns: Column[];
  rows: Array<Record<string, unknown>>;
  onAdd: (payload: Record<string, string>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  idKey?: string;
  searchableKeys?: string[];
};

export default function BlockList(props: BlockListProps) {
  const {
    title,
    addLabel = "+ Adicionar",
    columns,
    rows,
    onAdd,
    onDelete,
    idKey = "id",
    searchableKeys,
  } = props;

  const [open, setOpen] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const [form, setForm] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const c of columns) initial[c.key] = "";
    return initial;
  });

  const filteredRows = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return rows;
    const keys = searchableKeys && searchableKeys.length > 0 ? searchableKeys : columns.map(c => c.key);
    return rows.filter((row) => {
      return keys.some((k) => {
        const col = columns.find(c => c.key === k);
        const raw = String((row as Record<string, unknown>)[k] ?? "").toLowerCase();
        if (col && col.type === 'select' && col.options && col.options.length > 0) {
          const found = col.options.find(o => o.value === (row as Record<string, unknown>)[k]);
          const label = (found?.label ?? '').toLowerCase();
          return raw.includes(t) || label.includes(t);
        }
        return raw.includes(t);
      });
    });
  }, [rows, query, columns, searchableKeys]);

  async function handleAdd() {
    setPending(true); setError(null);
    try {
      // valida campos required
      for (const c of columns) {
        if (c.required && !String(form[c.key] ?? "").trim()) {
          throw new Error(`Campo obrigatório: ${c.label}`);
        }
      }
      const payload: Record<string, string> = {};
      columns.forEach((c) => { payload[c.key] = (form[c.key] ?? "").trim(); });
      await onAdd(payload);
      // reset
      const reset: Record<string, string> = {};
      for (const c of columns) reset[c.key] = "";
      setForm(reset);
      setAdding(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao adicionar";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <h3 className="font-semibold" style={{ color: 'var(--sand)' }}>{title}</h3>
        <button className="btn btn-ghost h-9 px-3" type="button">{open ? "Recolher" : "Expandir"}</button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
            />
            <button className="btn" type="button" onClick={() => setQuery("")}>Limpar</button>
            <div className="flex-1" />
            <button className="btn btn-primary" type="button" onClick={() => setAdding((v) => !v)}>
              {addLabel}
            </button>
          </div>

          {adding && (
            <div className="card p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {columns.map((c) => (
                  <div key={c.key}>
                    <label className="block text-sm muted">{c.label}</label>
                    {c.type === 'select' ? (
                      <select
                        className="select"
                        required={!!c.required}
                        value={form[c.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                      >
                        <option value="">Selecionar...</option>
                        {(c.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : c.type === 'textarea' ? (
                      <textarea
                        className="textarea"
                        required={!!c.required}
                        value={form[c.key] ?? ''}
                        onChange={(e) => setForm({ ...form, [c.key]: e.target.value })}
                      />
                    ) : (
                      <input
                        className="input"
                        value={form[c.key] ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (c.type === 'cpf' || c.type === 'cnpj') {
                            setForm({ ...form, [c.key]: formatCpfCnpj(raw) });
                          } else {
                            setForm({ ...form, [c.key]: raw });
                          }
                        }}
                        required={!!c.required}
                        type={c.type === "email" ? "email" : c.type === 'date' ? 'date' : "text"}
                      />
                    )}
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center gap-2">
                <button className="btn btn-primary" type="button" disabled={pending} onClick={handleAdd}>
                  {pending ? "Salvando..." : "Salvar"}
                </button>
                <button className="btn" type="button" onClick={() => { setAdding(false); setError(null); }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto card">
            <table className="table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  <th className="w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-3 muted">
                      Nenhum item.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={String(row[idKey])}>
                      {columns.map((c) => {
                        const value = row[c.key];
                        if (value == null || value === '') return <td key={c.key}>—</td>;
                        if (c.type === 'select' && c.options && c.options.length > 0) {
                          const found = c.options.find(o => o.value === value);
                          return <td key={c.key}>{found?.label ?? String(value)}</td>;
                        }
                        let text = String(value);
                        if (c.type === 'cpf' || c.type === 'cnpj') text = formatCpfCnpj(text);
                        if (c.type === 'date') {
                          try { text = new Date(text).toLocaleDateString(); } catch {}
                        }
                        if (c.type === 'textarea') {
                          text = text.length > 120 ? text.slice(0, 117) + '...' : text;
                        }
                        const formatted = text;
                        return <td key={c.key}>{formatted}</td>;
                      })}
                      <td>
                        <button
                          className="btn h-8 px-2"
                          type="button"
                          onClick={() => onDelete(String(row[idKey]))}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


