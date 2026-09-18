import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import Image from '@tiptap/extension-image';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Underline as GarisBawah,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { bacaFoto } from '../foto';

interface EditorIsiBeritaProps {
  value: string;
  onChange: (html: string) => void;
  error?: string;
}

export function EditorIsiBerita({
  value,
  onChange,
  error,
}: EditorIsiBeritaProps) {
  const [galatFoto, setGalatFoto] = useState<string | null>(null);
  const berkasRef = useRef<HTMLInputElement>(null);
  const [, setTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Image.configure({ inline: false }),
    ],
    content: value,
    autofocus: false,
    onTransaction: () => {
      setTick((t) => t + 1);
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          'isi-berita min-h-64 w-full rounded-b-lg bg-surface px-4 py-3 text-sm text-slate-900 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  const sisipkanFoto = async (berkas: File | undefined) => {
    if (!berkas || !editor) return;
    const hasil = await bacaFoto(berkas);
    if ('galat' in hasil) {
      setGalatFoto(hasil.galat);
      return;
    }
    setGalatFoto(null);

    const keterangan = window.prompt(
      'Keterangan foto untuk pembaca layar (boleh dikosongkan):',
      '',
    );
    editor
      .chain()
      .focus()
      .setImage({ src: hasil.dataUrl, alt: keterangan?.trim() || '' })
      .run();
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Isi Berita
      </label>

      <div
        className={cn(
          'overflow-hidden rounded-lg border-1 border-black focus-within:border-black focus-within:ring-1 focus-within:ring-black',
          error && 'border-red-500',
        )}
      >
        <div
          role="toolbar"
          aria-label="Format tulisan"
          aria-controls="isi-berita-editor"
          className="flex flex-wrap items-center gap-1 border-b-1 border-black bg-slate-100 px-2.5 py-1.5"
        >
          <TombolAlat
            label="Tebal"
            aktif={editor?.isActive('bold')}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Miring"
            aktif={editor?.isActive('italic')}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Garis bawah"
            aktif={editor?.isActive('underline')}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            <GarisBawah className="h-4 w-4" aria-hidden />
          </TombolAlat>

          <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden />

          <TombolAlat
            label="Judul bagian"
            aktif={editor?.isActive('heading', { level: 2 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Subjudul"
            aktif={editor?.isActive('heading', { level: 3 })}
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Daftar berpoin"
            aktif={editor?.isActive('bulletList')}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Daftar bernomor"
            aktif={editor?.isActive('orderedList')}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <TombolAlat
            label="Kutipan"
            aktif={editor?.isActive('blockquote')}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" aria-hidden />
          </TombolAlat>

          <span className="mx-1 h-5 w-px bg-slate-300" aria-hidden />

          <TombolAlat
            label="Sisipkan foto di sini"
            onClick={() => berkasRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" aria-hidden />
          </TombolAlat>
          <input
            ref={berkasRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void sisipkanFoto(e.target.files?.[0]);

              e.target.value = '';
            }}
          />
        </div>

        <EditorContent id="isi-berita-editor" editor={editor} />
      </div>

      {(error ?? galatFoto) && (
        <p className="mt-1 text-xs text-red-600">{error ?? galatFoto}</p>
      )}
    </div>
  );
}

function TombolAlat({
  label,
  aktif,
  onClick,
  children,
}: {
  label: string;
  aktif?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-pressed={aktif}
      aria-label={label}
      title={label}
      className={cn(
        'focus-ring cursor-pointer rounded-md p-1.5 text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900',
        aktif &&
          'shadow-xs bg-slate-900 text-white hover:bg-slate-800 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}
