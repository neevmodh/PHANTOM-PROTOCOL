"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileCheck, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";

interface UploadPanelProps {
  accept: string;
  label: string;
  hint: string;
  endpoint: string;
  onResult?: (data: unknown) => void;
}

type UploadState = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadPanel({ accept, label, hint, endpoint, onResult }: UploadPanelProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep onResult in a ref so handleFile always calls the latest version
  // without needing to be re-created every render
  const onResultRef = useRef(onResult);
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setState("uploading");
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", f);
        const data = await apiClient.postForm(endpoint, formData);
        setState("success");
        onResultRef.current?.(data);
      } catch (err: unknown) {
        setState("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [endpoint]  // endpoint is stable; onResult accessed via ref
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setState("idle");
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const reset = () => {
    setFile(null);
    setState("idle");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const borderColor = {
    idle: "border-cyber-border hover:border-cyber-accent",
    dragging: "border-cyber-accent bg-cyber-accent/5",
    uploading: "border-cyber-accent/50",
    success: "border-cyber-green",
    error: "border-cyber-red",
  }[state];

  return (
    <div className="glass-card p-6">
      <h2 className="section-title mb-4">Upload File</h2>

      <div
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
        onClick={() => state === "idle" && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
          borderColor,
          state === "idle" && "hover:bg-cyber-surface/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5 text-cyber-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-cyber-text">{label}</p>
                <p className="text-xs text-cyber-muted mt-1">{hint}</p>
              </div>
            </motion.div>
          )}

          {state === "dragging" && (
            <motion.div
              key="dragging"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-2"
            >
              <Upload className="w-10 h-10 text-cyber-accent mx-auto animate-bounce" />
              <p className="text-sm font-medium text-cyber-accent">Drop to analyze</p>
            </motion.div>
          )}

          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Loader2 className="w-10 h-10 text-cyber-accent mx-auto animate-spin" />
              <div>
                <p className="text-sm font-medium text-cyber-accent">Analyzing...</p>
                <p className="text-xs text-cyber-muted mt-1 truncate max-w-xs mx-auto">
                  {file?.name}
                </p>
              </div>
            </motion.div>
          )}

          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <FileCheck className="w-10 h-10 text-cyber-green mx-auto" />
              <div>
                <p className="text-sm font-medium text-cyber-green">Analysis complete</p>
                <p className="text-xs text-cyber-muted mt-1 truncate max-w-xs mx-auto">
                  {file?.name}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="btn-cyber text-xs px-4 py-1.5 mx-auto flex items-center gap-1.5"
              >
                <X className="w-3 h-3" /> Analyze another
              </button>
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <AlertCircle className="w-10 h-10 text-cyber-red mx-auto" />
              <div>
                <p className="text-sm font-medium text-cyber-red">Upload failed</p>
                <p className="text-xs text-cyber-muted mt-1">{error}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="btn-cyber-danger text-xs px-4 py-1.5 mx-auto flex items-center gap-1.5"
              >
                <X className="w-3 h-3" /> Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
