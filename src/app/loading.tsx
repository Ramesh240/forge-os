// src/app/loading.tsx
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
      style={{ backgroundColor: '#060609', color: '#f4f4f5' }}
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute -top-32 left-1/4 w-[420px] h-[420px] rounded-full blur-[140px] opacity-20"
          style={{ background: 'rgba(99, 102, 241, 0.4)' }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[380px] h-[380px] rounded-full blur-[140px] opacity-15"
          style={{ background: 'rgba(168, 85, 247, 0.3)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-6 max-w-sm text-center">
        {/* Animated App Icon Shell */}
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-white/10 shadow-2xl backdrop-blur-xl">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-xl animate-pulse">
              ⚡
            </div>
          </div>
          <div className="absolute -inset-1 rounded-3xl bg-indigo-500/20 blur-md -z-10 animate-pulse" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-zinc-100">
            Forge<span className="text-indigo-400">OS</span>
          </h1>
          <p className="text-xs font-mono text-zinc-400 tracking-wider uppercase">
            Initializing Flow Architecture...
          </p>
        </div>

        {/* Progress Bar / Pulsing indicator */}
        <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full animate-[shimmer_1.5s_infinite]"
            style={{
              width: '60%',
              animation: 'loadingProgress 1.4s ease-in-out infinite alternate',
            }}
          />
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes loadingProgress {
              0% { transform: translateX(-40%); }
              100% { transform: translateX(110%); }
            }
          `,
        }}
      />
    </div>
  );
}
