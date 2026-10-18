// src/app/api/playstore/icon/route.tsx
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
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#06060c',
          backgroundImage: 'linear-gradient(145deg, #0e0e1a 0%, #06060c 55%, #030306 100%)',
          position: 'relative',
        }}
      >
        {/* Ambient Lighting Orbs */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            width: 320,
            height: 320,
            borderRadius: 160,
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.45) 0%, rgba(99, 102, 241, 0) 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 320,
            height: 320,
            borderRadius: 160,
            background: 'radial-gradient(circle, rgba(217, 70, 239, 0.35) 0%, rgba(217, 70, 239, 0) 70%)',
            display: 'flex',
          }}
        />

        {/* Central Full-Bleed Compliant Forge Emblem */}
        <div
          style={{
            width: 370,
            height: 370,
            borderRadius: 88,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 45%, #d946ef 100%)',
            boxShadow: '0 28px 70px -10px rgba(99, 102, 241, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.3)',
            position: 'relative',
          }}
        >
          {/* Inner Gloss Rim */}
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 14,
              right: 14,
              bottom: 14,
              borderRadius: 74,
              border: '2px solid rgba(255, 255, 255, 0.22)',
              display: 'flex',
            }}
          />

          {/* Primary Letter Glyph */}
          <div
            style={{
              fontSize: 230,
              fontWeight: 900,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              textShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              lineHeight: 1,
              marginTop: -16,
            }}
          >
            F
          </div>

          {/* Energy Horizon Spark */}
          <div
            style={{
              width: 148,
              height: 10,
              borderRadius: 5,
              background: 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 100%)',
              display: 'flex',
              marginTop: 8,
              boxShadow: '0 4px 16px rgba(251, 191, 36, 0.65)',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
