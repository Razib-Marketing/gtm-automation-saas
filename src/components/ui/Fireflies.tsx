import { useEffect, useRef } from 'react';

export const Fireflies = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight; // Keep it 100vh for the hero section
    canvas.width = width;
    canvas.height = height;

    let fireflies: Firefly[] = [];
    const mouse = { x: -1000, y: -1000 };

    const colors = ['#00F0FF']; // Cyan fireflies

    class Firefly {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      baseOpacity: number;
      opacity: number;
      phase: number;
      phaseSpeed: number;
      color: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.radius = Math.random() * 2 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.baseOpacity = Math.random() * 0.2 + 0.05; // Lower opacity
        this.opacity = this.baseOpacity;
        this.phase = Math.random() * Math.PI * 2;
        this.phaseSpeed = Math.random() * 0.03 + 0.01;
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.phase += this.phaseSpeed;
        
        // Pulsing glow effect
        this.opacity = this.baseOpacity + Math.sin(this.phase) * 0.15; // Softer pulse
        if (this.opacity < 0.05) this.opacity = 0.05;

        // Bounce off edges smoothly
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction (Repel effect)
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const interactionRadius = 150;

        if (distance < interactionRadius) {
          const force = (interactionRadius - distance) / interactionRadius;
          const pushX = (dx / distance) * force * -1.5;
          const pushY = (dy / distance) * force * -1.5;
          this.x += pushX;
          this.y += pushY;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Ensure opacity doesn't drop below 0 to avoid canvas errors
        const safeOpacity = Math.max(0, Math.min(1, this.opacity));
        
        ctx.fillStyle = this.color;
        ctx.globalAlpha = safeOpacity;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.globalAlpha = 1.0; // reset
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      fireflies = [];
      const numFireflies = Math.floor((width * height) / 12000); // Dynamic density based on screen size
      for (let i = 0; i < numFireflies; i++) {
        fireflies.push(new Firefly());
      }
    };

    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      fireflies.forEach(f => {
        f.update();
        f.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1, // Sit above the mesh grid
        maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
      }}
    />
  );
};
