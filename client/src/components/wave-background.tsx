import { useEffect, useRef } from 'react';

interface Wave {
  amplitude: number;
  frequency: number;
  phase: number;
  speed: number;
  opacity: number;
}

const WaveBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const wavesRef = useRef<Wave[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize waves
    wavesRef.current = [
      { amplitude: 80, frequency: 0.02, phase: 0, speed: 0.01, opacity: 0.1 },
      { amplitude: 60, frequency: 0.03, phase: Math.PI / 2, speed: 0.015, opacity: 0.08 },
      { amplitude: 40, frequency: 0.04, phase: Math.PI, speed: 0.02, opacity: 0.06 },
      { amplitude: 30, frequency: 0.05, phase: Math.PI * 1.5, speed: 0.025, opacity: 0.04 },
    ];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawWave = (wave: Wave, time: number, yOffset: number) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      
      for (let x = 0; x <= canvas.width; x += 2) {
        const y = yOffset + wave.amplitude * Math.sin(x * wave.frequency + wave.phase + time * wave.speed);
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `rgba(34, 211, 238, ${wave.opacity})`);
      gradient.addColorStop(0.5, `rgba(14, 165, 233, ${wave.opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(12, 74, 110, ${wave.opacity * 0.3})`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    const animate = (time: number) => {
      // Check if user prefers reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw waves from back to front
      wavesRef.current.forEach((wave, index) => {
        const yOffset = canvas.height - 100 - (index * 20);
        drawWave(wave, time * 0.001, yOffset);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
      data-testid="wave-background"
    />
  );
};

export default WaveBackground;