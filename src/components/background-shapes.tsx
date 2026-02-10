'use client';

import React from 'react';

/**
 * Hienovaraiset suorakulmiot taustalla + gradient pohjaväri.
 * Säilyttää perusvärin #003049, elävöittää valoisuusasteilla.
 */
export function BackgroundShapes() {
  const base = '#003049';
  const gradient = `linear-gradient(165deg, ${base} 0%, #002538 35%, #003a56 70%, #002840 100%)`;

  const shades = [
    'rgba(10, 74, 107, 0.3)',
    'rgba(21, 74, 107, 0.22)',
    'rgba(30, 90, 123, 0.18)',
    'rgba(0, 40, 64, 0.35)',
    'rgba(15, 65, 95, 0.25)',
  ];

  const rectangles = [
    { width: 320, height: 200, left: '5%', top: '8%' },
    { width: 180, height: 140, left: '78%', top: '20%' },
    { width: 240, height: 160, left: '48%', top: '55%' },
    { width: 140, height: 220, left: '12%', top: '65%' },
    { width: 200, height: 120, left: '82%', top: '72%' },
    { width: 160, height: 180, left: '32%', top: '12%' },
    { width: 120, height: 100, left: '58%', top: '82%' },
    { width: 260, height: 140, left: '-3%', top: '38%' },
    { width: 150, height: 200, left: '88%', top: '45%' },
  ];

  return (
    <div
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{ background: gradient }}
      />
      {rectangles.map((r, i) => (
        <div
          key={i}
          className="absolute rounded-sm"
          style={{
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            background: shades[i % shades.length],
          }}
        />
      ))}
    </div>
  );
}
