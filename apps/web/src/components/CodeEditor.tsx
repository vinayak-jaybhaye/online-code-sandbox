import { useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { initVimMode } from 'monaco-vim';

import type { OnMount } from '@monaco-editor/react';

/** Editor instance type extracted from @monaco-editor/react's OnMount. */
type EditorInstance = Parameters<OnMount>[0];

/** Vim mode dispose handle. */
type VimMode = { dispose: () => void };

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  isDark?: boolean;
  vimMode?: boolean;
}

/**
 * Monaco Editor wrapper — controlled component.
 * Switches between vs-dark and light theme based on app theme.
 * Supports optional Vim keybindings via monaco-vim.
 */
export function CodeEditor({
  value,
  onChange,
  language,
  isDark = true,
  vimMode = false,
}: CodeEditorProps) {
  const editorRef = useRef<EditorInstance | null>(null);
  const vimModeRef = useRef<VimMode | null>(null);
  const statusBarRef = useRef<HTMLDivElement | null>(null);

  const disposeVim = useCallback(() => {
    if (vimModeRef.current) {
      vimModeRef.current.dispose();
      vimModeRef.current = null;
    }
  }, []);

  const enableVim = useCallback(() => {
    disposeVim();
    if (editorRef.current && statusBarRef.current) {
      vimModeRef.current = initVimMode(editorRef.current, statusBarRef.current) as VimMode;
    }
  }, [disposeVim]);

  useEffect(() => {
    if (vimMode) {
      enableVim();
    } else {
      disposeVim();
    }
  }, [vimMode, enableVim, disposeVim]);

  useEffect(() => {
    return () => disposeVim();
  }, [disposeVim]);

  const handleMount = (ed: EditorInstance) => {
    editorRef.current = ed;
    if (vimMode) {
      enableVim();
    }
  };

  return (
    <div className="relative h-full">
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? '')}
        theme={isDark ? 'vs-dark' : 'light'}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
        }}
      />
      {/* Vim status bar */}
      <div
        ref={statusBarRef}
        className={`absolute bottom-0 left-0 right-0 z-10 border-t px-3 py-1 font-mono text-xs transition-opacity ${
          vimMode
            ? 'border-(--color-border) bg-(--color-bg-secondary) text-(--color-text-secondary) opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />
    </div>
  );
}
