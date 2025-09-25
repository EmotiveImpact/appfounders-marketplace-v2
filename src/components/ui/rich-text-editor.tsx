'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  label,
  error,
  required = false,
  className,
  ...props
}: RichTextEditorProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
    onChange(e.target.value);
  };

  const handleBold = () => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    const newText = 
      localValue.substring(0, start) + 
      `**${selectedText}**` + 
      localValue.substring(end);
    
    setLocalValue(newText);
    onChange(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, end + 2);
    }, 0);
  };

  const handleItalic = () => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    const newText = 
      localValue.substring(0, start) + 
      `*${selectedText}*` + 
      localValue.substring(end);
    
    setLocalValue(newText);
    onChange(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 1, end + 1);
    }, 0);
  };

  const handleHeading = () => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    // Find the start of the line
    let lineStart = start;
    while (lineStart > 0 && localValue[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    const newText = 
      localValue.substring(0, lineStart) + 
      `## ${localValue.substring(lineStart, end)}` + 
      localValue.substring(end);
    
    setLocalValue(newText);
    onChange(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(end + 3, end + 3);
    }, 0);
  };

  const handleList = () => {
    const textarea = document.getElementById('rich-text-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    // Split the selected text by newlines and add list markers
    const lines = selectedText.split('\n');
    const formattedLines = lines.map(line => `- ${line}`).join('\n');
    
    const newText = 
      localValue.substring(0, start) + 
      formattedLines + 
      localValue.substring(end);
    
    setLocalValue(newText);
    onChange(newText);
    
    // Set cursor position after formatting
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(end + lines.length * 2, end + lines.length * 2);
    }, 0);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex justify-between">
          <label htmlFor="rich-text-editor" className="block text-sm font-medium">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        </div>
      )}
      
      <div className="border rounded-md overflow-hidden">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 border-b flex space-x-2">
          <button 
            type="button"
            onClick={handleBold}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Bold"
          >
            <span className="font-bold">B</span>
          </button>
          <button 
            type="button"
            onClick={handleItalic}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Italic"
          >
            <span className="italic">I</span>
          </button>
          <button 
            type="button"
            onClick={handleHeading}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Heading"
          >
            <span className="font-semibold">H</span>
          </button>
          <button 
            type="button"
            onClick={handleList}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title="List"
          >
            <span>• List</span>
          </button>
        </div>
        
        <textarea
          id="rich-text-editor"
          value={localValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full px-3 py-2 min-h-[150px] focus:outline-none",
            error ? "border-red-500" : isFocused ? "border-blue-500" : ""
          )}
          rows={8}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      <div className="text-xs text-gray-500">
        <p>Supports Markdown: **bold**, *italic*, ## headings, - lists</p>
      </div>
    </div>
  );
}
