export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-bg cyber-grid-bg relative overflow-hidden">
      <div className="absolute inset-0 scan-sweep opacity-20 pointer-events-none" />
      <div className="relative z-10 glass-card-soft p-8 w-[min(92vw,28rem)] text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl border border-cyber-accent/30 bg-cyber-surface/60 flex items-center justify-center loading-shimmer">
          <div className="w-7 h-7 rounded-full border-2 border-cyber-accent border-t-transparent animate-spin" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyber-muted">ISAFE</p>
          <h1 className="text-2xl font-semibold text-cyber-text mt-2">Scanning secure workspace</h1>
          <p className="text-sm text-cyber-muted-light mt-2 leading-relaxed">
            Loading live analytics, forensic reports, and integrity telemetry.
          </p>
        </div>
        <div className="space-y-3 text-left">
          <div className="h-3 rounded-full loading-shimmer" />
          <div className="h-3 rounded-full loading-shimmer w-5/6" />
          <div className="h-3 rounded-full loading-shimmer w-2/3" />
        </div>
      </div>
    </div>
  );
}