'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
}

interface UseSteamParticlesOptions {
  particleCount?: number;
  isActive?: boolean;
}

export function useSteamParticles(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseSteamParticlesOptions = {}
) {
  const { particleCount = 25, isActive = true } = options;
  const animFrameIdRef = useRef<number | null>(null);
  const isVisibleRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || 300);
    let height = (canvas.height = canvas.offsetHeight || 300);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 300;
      height = canvas.height = canvas.offsetHeight || 300;
    };

    window.addEventListener('resize', handleResize);

    // Initialize particles
    const createParticle = (initialYRandom = false): Particle => {
      const maxLife = 80 + Math.random() * 60;
      return {
        x: width * 0.3 + Math.random() * (width * 0.4),
        y: initialYRandom ? Math.random() * height : height * 0.7 + Math.random() * (height * 0.2),
        size: 15 + Math.random() * 25,
        speedY: -(0.6 + Math.random() * 0.8),
        speedX: (Math.random() - 0.5) * 0.4,
        opacity: 0.01,
        maxOpacity: 0.15 + Math.random() * 0.2,
        life: initialYRandom ? Math.random() * maxLife : 0,
        maxLife,
      };
    };

    const particles: Particle[] = Array.from({ length: particleCount }, () => createParticle(true));

    // IntersectionObserver to pause when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    const render = () => {
      if (!isVisibleRef.current) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, index) => {
        p.life += 1;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.life * 0.05) * 0.3; // subtle wave motion
        p.size += 0.35; // steam expands as it rises

        // Fade in then fade out
        const progress = p.life / p.maxLife;
        if (progress < 0.3) {
          p.opacity = (progress / 0.3) * p.maxOpacity;
        } else {
          p.opacity = (1 - (progress - 0.3) / 0.7) * p.maxOpacity;
        }

        if (p.life >= p.maxLife || p.opacity <= 0 || p.y <= 0) {
          particles[index] = createParticle(false);
          return;
        }

        // Draw radial steam particle
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${p.opacity})`);
        gradient.addColorStop(0.5, `rgba(240, 240, 245, ${p.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [canvasRef, particleCount, isActive]);
}
