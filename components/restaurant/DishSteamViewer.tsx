'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSteamParticles } from '@/lib/hooks/useSteamParticles';

interface DishSteamViewerProps {
  src: string;
  alt?: string;
  className?: string;
  enableSteam?: boolean;
  enableRotation?: boolean;
  dishName?: string;
  price?: string;
}

export const DishSteamViewer: React.FC<DishSteamViewerProps> = ({
  src,
  alt = 'Plato de restaurante',
  className = '',
  enableSteam = true,
  enableRotation = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particleCount, setParticleCount] = useState(25);

  useEffect(() => {
    // Reducir humo en móviles a 8 partículas sutiles
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setParticleCount(8);
    }
  }, []);

  useSteamParticles(canvasRef, {
    particleCount,
    isActive: enableSteam,
  });

  return (
    <div className={`relative w-full h-full overflow-hidden group ${className}`} style={{ perspective: '750px' }}>
      {/* 
        Contenedor 3D: Cámara Gimbal Orbitando 360° Alrededor del Plato
        Recorre: ADELANTE (Front) -> DERECHA (Right Side) -> ATRÁS (Back Top) -> IZQUIERDA (Left Side)
      */}
      <div
        className={`w-full h-full relative transform-gpu ${
          enableRotation ? 'animate-full-3d-orbit' : ''
        }`}
        style={{ transformStyle: 'preserve-3d', transformOrigin: 'center center' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-130"
          loading="lazy"
        />

        {/* Destello de Lente Cinemático */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/12 to-transparent animate-lens-flare pointer-events-none" />
      </div>

      {/* Capa de Vapor — Humo de comida caliente */}
      {enableSteam && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-20 opacity-35 sm:opacity-80 transition-opacity duration-500"
        />
      )}

      {/* Viñeta Studio Enfoque */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <style jsx global>{`
        /*
          Órbita 3D Completa de Cámara (360° Orbit B-Roll commercial camera pan):
          0%   : ADELANTE (Vista frontal baja ~16°)
          25%  : DERECHA (Toma lateral derecha con zoom y desplazamiento)
          50%  : ATRÁS (Vista superior trasera picada ~-14°)
          75%  : IZQUIERDA (Toma lateral izquierda con zoom y desplazamiento)
          100% : ADELANTE (Retorno fluido al frente)
        */
        @keyframes full3dOrbit {
          0% {
            transform: scale(1.20) rotateX(16deg) rotateY(0deg) translateX(0px) translateY(0px);
          }
          25% {
            transform: scale(1.28) rotateX(6deg) rotateY(26deg) translateX(-30px) translateY(-12px);
          }
          50% {
            transform: scale(1.35) rotateX(-14deg) rotateY(0deg) translateX(0px) translateY(-24px);
          }
          75% {
            transform: scale(1.28) rotateX(6deg) rotateY(-26deg) translateX(30px) translateY(-12px);
          }
          100% {
            transform: scale(1.20) rotateX(16deg) rotateY(0deg) translateX(0px) translateY(0px);
          }
        }

        @keyframes lensFlare {
          0% {
            transform: translateX(-150%) skewX(-20deg);
          }
          45%, 100% {
            transform: translateX(180%) skewX(-20deg);
          }
        }

        .animate-full-3d-orbit {
          animation: full3dOrbit 10s ease-in-out infinite;
        }

        .animate-lens-flare {
          animation: lensFlare 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default DishSteamViewer;
