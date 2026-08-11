'use client';

import React, { useRef } from 'react';
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

  // Activate canvas steam particles
  useSteamParticles(canvasRef, {
    particleCount: 25,
    isActive: enableSteam,
  });

  return (
    <div className={`relative w-full h-full overflow-hidden group perspective-1000 ${className}`}>
      {/* 3D Animated Image Container - Continuous Commercial Motion (Like a GIF loop) */}
      <div
        className={`w-full h-full relative overflow-hidden transform-gpu ${
          enableRotation ? 'animate-cinematic-food-pan' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transform scale-110 transition-transform duration-700 group-hover:scale-115"
          loading="lazy"
        />

        {/* Cinematic Light Reflection Sweep / Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-light-sweep pointer-events-none" />
      </div>

      {/* Steam Canvas Overlay - Positioned over the food plate */}
      {enableSteam && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-85 transition-opacity duration-500"
        />
      )}

      {/* Keyframe Styles for Continuous Cinematic Commercial Pan & Light Sweep */}
      <style jsx global>{`
        @keyframes cinematicFoodPan {
          0% {
            transform: scale(1.08) rotate(0deg) translateY(0px) rotateX(0deg);
          }
          25% {
            transform: scale(1.12) rotate(1.2deg) translateY(-3px) rotateX(2deg);
          }
          50% {
            transform: scale(1.15) rotate(0deg) translateY(-5px) rotateX(0deg);
          }
          75% {
            transform: scale(1.12) rotate(-1.2deg) translateY(-2px) rotateX(-2deg);
          }
          100% {
            transform: scale(1.08) rotate(0deg) translateY(0px) rotateX(0deg);
          }
        }
        @keyframes lightSweep {
          0% {
            transform: translateX(-150%) skewX(-15deg);
          }
          50%, 100% {
            transform: translateX(150%) skewX(-15deg);
          }
        }
        .animate-cinematic-food-pan {
          animation: cinematicFoodPan 10s ease-in-out infinite;
        }
        .animate-light-sweep {
          animation: lightSweep 7s ease-in-out infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default DishSteamViewer;
