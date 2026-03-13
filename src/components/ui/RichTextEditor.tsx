'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const COLORS = [
  { label: 'Preto', value: '#000000' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Azul', value: '#2563eb' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Laranja', value: '#ea580c' },
  { label: 'Roxo', value: '#9333ea' },
];

const HIGHLIGHTS = [
  { label: 'Amarelo', value: '#fef08a' },
  { label: 'Verde', value: '#bbf7d0' },
  { label: 'Azul', value: '#bfdbfe' },
  { label: 'Rosa', value: '#fecdd3' },
  { label: 'Laranja', value: '#fed7aa' },
];

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none text-sm',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded bg-white">
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-xs font-bold rounded border transition-colors ${
            editor.isActive('bold') ? 'bg-[#0369a1] text-white border-[#0369a1]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          title="Negrito"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-xs italic rounded border transition-colors ${
            editor.isActive('italic') ? 'bg-[#0369a1] text-white border-[#0369a1]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          title="Itálico"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-2 py-1 text-xs underline rounded border transition-colors ${
            editor.isActive('underline') ? 'bg-[#0369a1] text-white border-[#0369a1]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          title="Sublinhado"
        >
          U
        </button>

        <span className="w-px bg-gray-300 mx-1" />

        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setColor(e.target.value).run();
            } else {
              editor.chain().focus().unsetColor().run();
            }
          }}
          className="px-1 py-1 text-xs border border-gray-300 rounded bg-white cursor-pointer"
          title="Cor do texto"
          value=""
        >
          <option value="">Cor</option>
          {COLORS.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        <select
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
            } else {
              editor.chain().focus().unsetHighlight().run();
            }
          }}
          className="px-1 py-1 text-xs border border-gray-300 rounded bg-white cursor-pointer"
          title="Destaque"
          value=""
        >
          <option value="">Destaque</option>
          {HIGHLIGHTS.map(h => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>

        <span className="w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            editor.isActive('bulletList') ? 'bg-[#0369a1] text-white border-[#0369a1]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
          }`}
          title="Lista"
        >
          Lista
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
