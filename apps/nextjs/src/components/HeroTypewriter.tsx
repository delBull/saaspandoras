'use client';

import React from 'react';
import DigitalTypewriter from './DigitalTypewriter';

export function HeroTypewriter() {
  const typewriterWords = [
    { text: "Proyectos Inmobiliarios.", cursorColor: "#A3E635", contentColor: "#A3E635" },
    { text: "Startups Disruptivas.", cursorColor: "#7b1b74", contentColor: "#7b1b74" },
    { text: "Activos Exclusivos.", cursorColor: "#A3E635", contentColor: "#A3E635" },
  ];

  return (
    <div >
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-3xl md:text-5xl font-bold tracking-tighter">
          <p>Activos Reales. Inversión Digital.</p>
          <div style={{ height: '1.2em' }}>
            <DigitalTypewriter
              texts={typewriterWords}
              font={{
                fontFamily: "inherit",
                fontWeight: 500,
                fontSize: "inherit",
                lineHeight: "1.2em",
              }}
              delay={1}
            />
          </div>
          <p className='font-shadows'>Tu portafolio, ahora tangible.</p>
        </div>
      </div>
    </div>
  );
}