"use client";

import { useEffect, useRef } from "react";

export function AnimatedBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let t = 0;

    const orbs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 250 + Math.random() * 150,
      speed: 0.0003 + Math.random() * 0.0002,
      phase: (i * Math.PI * 2) / 4,
      hue: [240, 270, 220, 260][i],
    }));

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const orb of orbs) {
        const cx = (orb.x + Math.sin(t * orb.speed + orb.phase) * 0.15) * canvas.width;
        const cy = (orb.y + Math.cos(t * orb.speed * 0.7 + orb.phase) * 0.12) * canvas.height;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.r);
        grad.addColorStop(0, `hsla(${orb.hue}, 70%, 55%, 0.12)`);
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, orb.r, 0, Math.PI * 2);
        ctx.fill();
      }

      t++;
      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
