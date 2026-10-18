// src/app/api/playstore/feature-graphic/route.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#06060c',
          backgroundImage: 'linear-gradient(135deg, #0b0b18 0%, #06060c 50%, #030306 100%)',
          padding: '40px 52px',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Neon Backlights */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: 140,
            width: 480,
            height: 360,
            borderRadius: 240,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -80,
            right: 80,
            width: 520,
            height: 400,
            borderRadius: 260,
            background: 'radial-gradient(circle, rgba(217, 70, 239, 0.28) 0%, rgba(217, 70, 239, 0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 380,
            width: 280,
            height: 280,
            borderRadius: 140,
            background: 'radial-gradient(circle, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* ========================================================= */}
        {/* LEFT COLUMN: BRANDING, HEADLINE & FEATURE BADGES          */}
        {/* ========================================================= */}
        <div
          style={{
            width: 510,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Brand Logo Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.6)',
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: '#ffffff',
                  display: 'flex',
                }}
              >
                F
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  color: '#ffffff',
                  display: 'flex',
                }}
              >
                ForgeOS
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: '#94a3b8',
                  fontWeight: 700,
                  display: 'flex',
                }}
              >
                Identity &amp; Habit Mastery Flow
              </div>
            </div>
          </div>

          {/* Punchy Play Store Headline */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 22,
              lineHeight: 1.12,
            }}
          >
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                color: '#ffffff',
                letterSpacing: -1,
                display: 'flex',
              }}
            >
              Start in 2 Minutes.
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 900,
                letterSpacing: -1,
                background: 'linear-gradient(90deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                display: 'flex',
              }}
            >
              Compound for 10,000 Hours.
            </div>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 13,
              color: '#94a3b8',
              lineHeight: 1.45,
              marginTop: 12,
              display: 'flex',
              maxWidth: 460,
            }}
          >
            Transform friction into flow. Master algorithmic thinking, system design, and deep creative habits with automated micro-start timers and telemetry.
          </div>

          {/* Feature Badges Row */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              marginTop: 22,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                border: '1px solid rgba(99, 102, 241, 0.35)',
                fontSize: 11,
                fontWeight: 700,
                color: '#c7d2fe',
              }}
            >
              <div style={{ display: 'flex' }}>⚡</div>
              <div style={{ display: 'flex' }}>2-Min Micro-Timer</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                fontSize: 11,
                fontWeight: 700,
                color: '#e9d5ff',
              }}
            >
              <div style={{ display: 'flex' }}>🔗</div>
              <div style={{ display: 'flex' }}>Atomic Stacking</div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                fontSize: 11,
                fontWeight: 700,
                color: '#a7f3d0',
              }}
            >
              <div style={{ display: 'flex' }}>📈</div>
              <div style={{ display: 'flex' }}>10k Hours Matrix</div>
            </div>
          </div>

          {/* Play Store Certification Tag */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginTop: 20,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#64748b',
                display: 'flex',
              }}
            >
              Google Play Verified • Trusted Web Activity • Cross-Platform Sync
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: MOCK GLASS TIMER CARD                       */}
        {/* ========================================================= */}
        <div
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            padding: 22,
            borderRadius: 26,
            backgroundColor: 'rgba(18, 18, 30, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 28px 60px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Card Top: Identity Vector Tag & Phase */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 12,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#818cf8',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: '#e0e7ff',
                  display: 'flex',
                }}
              >
                Algorithms Specialist
              </div>
            </div>

            <div
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                display: 'flex',
              }}
            >
              PHASE II: APPRENTICE
            </div>
          </div>

          {/* Active Habit Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 14,
            }}
          >
            <div
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: '#ffffff',
                display: 'flex',
              }}
            >
              Master System Architecture
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#94a3b8',
                marginTop: 2,
                display: 'flex',
              }}
            >
              Anchor: Morning Coffee • 2-Min Gateway Protocol
            </div>
          </div>

          {/* Central Micro-Timer Display */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 0',
              marginTop: 14,
              borderRadius: 18,
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#ffffff',
                letterSpacing: 2,
                textShadow: '0 0 24px rgba(99, 102, 241, 0.8)',
                lineHeight: 1,
                display: 'flex',
              }}
            >
              02:00
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#34d399',
                  boxShadow: '0 0 8px #34d399',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  color: '#6ee7b7',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  display: 'flex',
                }}
              >
                Micro-Start Active Flow
              </div>
            </div>
          </div>

          {/* Progress Track */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 14,
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                fontSize: 10,
                color: '#94a3b8',
              }}
            >
              <div style={{ display: 'flex' }}>Daily Micro-Goal</div>
              <div style={{ display: 'flex', color: '#818cf8', fontWeight: 700 }}>
                100% Committed
              </div>
            </div>
            <div
              style={{
                width: '100%',
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '85%',
                  height: '100%',
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)',
                  display: 'flex',
                }}
              />
            </div>
          </div>

          {/* Card Footer: Live Metrics */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', display: 'flex' }}>
                Resilient Streak
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#f97316', display: 'flex' }}>
                🔥 14 Days
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', display: 'flex' }}>
                Mastery Hours
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#38bdf8', display: 'flex' }}>
                ⚡ 42.5h / 10k
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', display: 'flex' }}>
                Friction Score
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981', display: 'flex' }}>
                1.2 Low Friction
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1024,
      height: 500,
    }
  );
}
