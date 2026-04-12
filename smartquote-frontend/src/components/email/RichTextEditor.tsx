// src/components/email/RichTextEditor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useCallback } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minHeight?: number;
}

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                    ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                    : 'text-themed-muted hover:text-themed hover-themed'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            {children}
        </button>
    );
}

export default function RichTextEditor({
                                           value,
                                           onChange,
                                           placeholder = 'Wpisz treść wiadomości...',
                                           minHeight = 280,
                                       }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: { keepMarks: true },
                orderedList: { keepMarks: true },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-cyan-600 underline' },
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getText({ blockSeparator: '\n' }));
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none text-themed',
                style: `min-height: ${minHeight}px; padding: 12px;`,
            },
        },
    });

    useEffect(() => {
        if (!editor) return;
        const currentText = editor.getText({ blockSeparator: '\n' });
        if (currentText !== value && value === '') {
            editor.commands.clearContent();
        }
    }, [value, editor]);

    const handleSetLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href as string | undefined;
        const url = window.prompt('Podaj URL:', previousUrl ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Pogrubienie (Ctrl+B)"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z"/>
                    </svg>
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Kursywa (Ctrl+I)"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/>
                    </svg>
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    isActive={editor.isActive('underline')}
                    title="Podkreślenie (Ctrl+U)"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/>
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Nagłówek"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 4v3h5.5v12h3V7H19V4z"/>
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Lista punktowana"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                    </svg>
                </ToolbarButton>

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Lista numerowana"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"/>
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolbarButton
                    onClick={handleSetLink}
                    isActive={editor.isActive('link')}
                    title="Wstaw link"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                    </svg>
                </ToolbarButton>

                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                    title="Wyczyść formatowanie"
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 13.5V21h2v-3h2.31l5.19 3H18l-5.41-3.13A4.997 4.997 0 0015 13c0-2.76-2.24-5-5-5H6v1.5l-3-3 3-3V5h10v2h2V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v3.5l-2 2 2 2V13.5zm2-3.5h2c1.65 0 3 1.35 3 3s-1.35 3-3 3H8v-6z"/>
                    </svg>
                </ToolbarButton>
            </div>

            <div
                className="bg-white dark:bg-slate-900 cursor-text"
                onClick={() => editor.commands.focus()}
            >
                <style>{`
                    .ProseMirror p.is-editor-empty:first-child::before {
                        content: attr(data-placeholder);
                        float: left;
                        color: #94a3b8;
                        pointer-events: none;
                        height: 0;
                    }
                    .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; }
                    .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; }
                    .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.5em 0; }
                    .ProseMirror strong { font-weight: 700; }
                    .ProseMirror em { font-style: italic; }
                    .ProseMirror u { text-decoration: underline; }
                    .ProseMirror p { margin: 0.25em 0; }
                `}</style>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}