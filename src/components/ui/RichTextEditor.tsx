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
  readOnly?: boolean;
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

export default function RichTextEditor({ content, onChange, placeholder, readOnly = false }: RichTextEditorProps) {
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
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-3 min-h-[120px] focus:outline-none text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);

  if (!editor) return null;

  const currentTextColor = editor.getAttributes('textStyle').color as string | undefined;
  const currentHighlightColor = editor.getAttributes('highlight').color as string | undefined;

  return (
    <div className="border border-gray-300 rounded bg-white">
      {!readOnly && (
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

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-gray-500">Texto</span>
          <span
            className="w-4 h-4 rounded border border-gray-400"
            style={
              currentTextColor
                ? { backgroundColor: currentTextColor }
                : { background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 2px, #d1d5db 2px, #d1d5db 4px)' }
            }
            title={currentTextColor ? `Cor atual do texto: ${currentTextColor}` : 'Sem cor no texto'}
            aria-label={currentTextColor ? `Cor atual do texto: ${currentTextColor}` : 'Sem cor no texto'}
          />
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => editor.chain().focus().setColor(c.value).run()}
              className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${
                editor.isActive('textStyle', { color: c.value }) ? 'border-[#0369a1] ring-1 ring-[#0369a1]' : 'border-gray-300'
              }`}
              style={{ backgroundColor: c.value }}
              title={`Cor do texto: ${c.label}`}
              aria-label={`Cor do texto: ${c.label}`}
            />
          ))}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="px-1.5 py-1 text-[11px] rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            title="Remover cor do texto"
          >
            Limpar
          </button>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-gray-500">Marca</span>
          <span
            className="w-4 h-4 rounded border border-gray-400"
            style={
              currentHighlightColor
                ? { backgroundColor: currentHighlightColor }
                : { background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 2px, #d1d5db 2px, #d1d5db 4px)' }
            }
            title={currentHighlightColor ? `Cor atual do destaque: ${currentHighlightColor}` : 'Sem destaque no texto'}
            aria-label={currentHighlightColor ? `Cor atual do destaque: ${currentHighlightColor}` : 'Sem destaque no texto'}
          />
          {HIGHLIGHTS.map((h) => (
            <button
              key={h.value}
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight({ color: h.value }).run()}
              className={`w-5 h-5 rounded border transition-transform hover:scale-110 ${
                editor.isActive('highlight', { color: h.value }) ? 'border-[#0369a1] ring-1 ring-[#0369a1]' : 'border-gray-300'
              }`}
              style={{ backgroundColor: h.value }}
              title={`Cor de destaque: ${h.label}`}
              aria-label={`Cor de destaque: ${h.label}`}
            />
          ))}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetHighlight().run()}
            className="px-1.5 py-1 text-[11px] rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            title="Remover destaque"
          >
            Limpar
          </button>
        </div>

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

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 text-xs rounded border transition-colors bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
          title="Separador"
        >
          Separador
        </button>
      </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
