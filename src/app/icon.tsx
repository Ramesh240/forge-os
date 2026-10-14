// src/app/icon.tsx
import { ImageResponse } from 'next/og';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 300,
          background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          borderRadius: 112,
          fontFamily: 'sans-serif',
        }}
      >
        F
      </div>
    ),
    {
      ...size,
    }
  );
}
