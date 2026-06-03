"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Radar,
  FileImage,
  FileText,
  Mic,
  Video,
  Link2,
  Sparkles,
  Gauge,
  Lock,
  Brain,
  Database,
  Layers3,
  Activity,
  Clock3,
} from "lucide-react";

const MODULES = [
  { href: "/image-detection", label: "Image", icon: FileImage, detail: "Forgery traces, ELA, noise, and compression artifacts." },
  { href: "/video-detection", label: "Video", icon: Video, detail: "Frame-level cues, temporal drift, blink, and motion checks." },
  { href: "/audio-detection", label: "Audio", icon: Mic, detail: "Voice-clone probability, spectral drift, and pitch stability." },
  { href: "/document-detection", label: "Document", icon: FileText, detail: "OCR consistency, metadata mismatch, and structure anomalies." },
  { href: "/url-detection", label: "URL", icon: Link2, detail: "Threat indicators, redirect behavior, and domain reputation." },
];

const PIPELINE = [
  "Upload media",
  "Run forensic analysis",
  "Generate explanation",
  "Persist evidence",
];

const SIGNALS = [
  { label: "Scan latency", value: "< 2 min", icon: Clock3 },
  { label: "Evidence trail", value: "Stored in CSV", icon: Database },
  { label: "Risk scoring", value: "0-100 trust", icon: Gauge },
  { label: "Detection modes", value: "5 modules", icon: Layers3 },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-cyber-bg text-cyber-text">
      <div className="absolute inset-0 cyber-grid-bg opacity-50" />
      <div className="absolute -top-28 right-[-6%] h-80 w-80 rounded-full bg-cyber-accent/10 blur-3xl" />
      <div className="absolute top-40 left-[-8%] h-72 w-72 rounded-full bg-cyber-purple/10 blur-3xl" />

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-2xl border border-cyber-border/50 bg-cyber-surface/70 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyber-accent/15 border border-cyber-accent/30 shadow-[0_0_24px_rgba(0,212,255,0.15)]">
              <Shield className="h-5 w-5 text-cyber-accent" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyber-muted">ISAFE</p>
              <p className="text-sm font-semibold text-cyber-text">Synthetic media forensics</p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-cyber-green/20 bg-cyber-green/10 px-3 py-1.5 text-[11px] font-medium text-cyber-green sm:flex">
            <span className="h-2 w-2 rounded-full bg-cyber-green animate-pulse" />
            Live analysis stack ready
          </div>

          <Link href="/dashboard" className="btn-cyber-primary inline-flex items-center gap-2 text-sm">
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyber-accent/20 bg-cyber-accent/10 px-3 py-1.5 text-[11px] font-medium text-cyber-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Production-quality hackathon MVP
            </div>

            <div className="space-y-5 max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-7xl">
                Detect synthetic media, explain the evidence, and ship the result.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-cyber-muted-light sm:text-lg">
                ISAFE is a full forensic console for images, video, audio, documents, and URLs. Upload a file, run the analyzer, review the trust score, and export a report with the evidence trail attached.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard" className="btn-cyber-primary inline-flex items-center justify-center gap-2">
                Launch dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#modules" className="btn-cyber inline-flex items-center justify-center gap-2">
                Explore modules
                <Radar className="h-4 w-4" />
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {SIGNALS.map((signal) => (
                <div key={signal.label} className="glass-card-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-cyber-muted">{signal.label}</p>
                      <p className="mt-2 text-lg font-semibold text-cyber-text">{signal.value}</p>
                    </div>
                    <div className="rounded-lg border border-cyber-border/50 bg-cyber-surface/80 p-2">
                      <signal.icon className="h-4 w-4 text-cyber-accent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-6 rounded-[32px] bg-cyber-accent/5 blur-2xl" />
            <div className="relative glass-card p-6 sm:p-7 scan-sweep">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-cyber-muted">Forensic cockpit</p>
                  <p className="mt-2 text-2xl font-semibold text-cyber-text">System status: online</p>
                </div>
                <div className="rounded-full border border-cyber-green/20 bg-cyber-green/10 px-3 py-1 text-[11px] font-medium text-cyber-green">
                  Secure pipeline
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-cyber-border/40 bg-cyber-surface/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 p-3">
                      <Brain className="h-5 w-5 text-cyber-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-cyber-text">Analysis workflow</p>
                      <p className="text-xs text-cyber-muted-light">Each scan records trust, confidence, and explanation text.</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PIPELINE.map((step, index) => (
                    <div key={step} className="rounded-2xl border border-cyber-border/40 bg-cyber-surface/55 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyber-accent/10 border border-cyber-accent/20 text-xs font-semibold text-cyber-accent">
                          {index + 1}
                        </div>
                        <p className="text-sm text-cyber-text">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-cyber-border/40 bg-cyber-surface/60 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-cyber-muted">Evidence quality</p>
                      <p className="mt-2 text-3xl font-semibold text-cyber-green">94%</p>
                    </div>
                    <div className="h-16 w-16 rounded-full border border-cyber-green/20 bg-cyber-green/10 flex items-center justify-center">
                      <Lock className="h-7 w-7 text-cyber-green" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <section id="modules" className="pb-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyber-muted">Modules</p>
              <h2 className="mt-2 text-2xl font-semibold text-cyber-text">Open a detector and upload media</h2>
            </div>
            <Link href="/dashboard" className="hidden text-sm text-cyber-accent hover:text-cyber-green sm:inline-flex items-center gap-2">
              View telemetry
              <Activity className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <Link key={module.href} href={module.href} className="glass-card-soft group p-5 transition-all duration-200 hover:-translate-y-1 hover:border-cyber-accent/40">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-cyber-border/50 bg-cyber-surface/70 transition-colors group-hover:border-cyber-accent/30 group-hover:bg-cyber-accent/10">
                    <Icon className="h-5 w-5 text-cyber-accent" />
                  </div>
                  <p className="text-lg font-semibold text-cyber-text">{module.label}</p>
                  <p className="mt-2 text-sm leading-6 text-cyber-muted-light">{module.detail}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm text-cyber-accent transition-colors group-hover:text-cyber-green">
                    Open module
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
