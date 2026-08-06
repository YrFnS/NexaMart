import { ImageResponse } from 'next/og';
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from '@/lib/config';

export const alt = `${APP_NAME} - ${APP_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background:
            'radial-gradient(circle at 85% 15%, rgba(251, 191, 36, 0.36), transparent 34%), linear-gradient(135deg, #111827 0%, #451a03 56%, #b45309 100%)',
          color: '#fff7ed',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          padding: '68px',
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'flex-start',
            border: '2px solid rgba(251, 191, 36, 0.45)',
            borderRadius: '36px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: '58px 64px',
            width: '100%',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              fontSize: 30,
              fontWeight: 700,
              gap: 18,
              letterSpacing: '-0.02em',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                background: '#d97706',
                borderRadius: '18px',
                display: 'flex',
                fontSize: 34,
                height: 64,
                justifyContent: 'center',
                width: 64,
              }}
            >
              N
            </div>
            {APP_NAME}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div
              style={{
                color: '#fef3c7',
                display: 'flex',
                fontSize: 68,
                fontWeight: 800,
                letterSpacing: '-0.055em',
                lineHeight: 1.02,
                maxWidth: 880,
              }}
            >
              {APP_TAGLINE}
            </div>
            <div
              style={{
                color: '#fed7aa',
                display: 'flex',
                fontSize: 27,
                lineHeight: 1.42,
                maxWidth: 900,
              }}
            >
              {APP_DESCRIPTION}
            </div>
          </div>

          <div
            style={{
              color: '#fcd34d',
              display: 'flex',
              fontSize: 24,
              fontWeight: 600,
              gap: 28,
            }}
          >
            <span>Independent stores</span>
            <span>•</span>
            <span>Pay on delivery</span>
            <span>•</span>
            <span>Tracked fulfilment</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
