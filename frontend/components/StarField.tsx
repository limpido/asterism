import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const setSize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };
    setSize();

    // Star properties
    const stars: { x: number; y: number; r: number; alpha: number; dAlpha: number }[] = [];
    // Density: roughly 1 star per 4000px^2
    const numStars = Math.floor((width * height) / 4000); 

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 1.2 + 0.3, // Radius 0.3 to 1.5
            alpha: Math.random(),
            dAlpha: (Math.random() - 0.5) * 0.02 // Twinkle speed
        });
    }

    let animationId: number;

    const animate = () => {
        ctx.clearRect(0, 0, width, height);
        
        stars.forEach(star => {
            // Update alpha
            star.alpha += star.dAlpha;
            if (star.alpha <= 0 || star.alpha >= 1) {
                star.dAlpha *= -1; // Reverse fade direction
            }
            // Clamp
            const visibleAlpha = Math.max(0, Math.min(1, star.alpha));

            // Draw
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
            // Use a slightly warm white for star realism
            ctx.fillStyle = `rgba(255, 255, 240, ${visibleAlpha * 0.8})`; 
            ctx.fill();
        });

        animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
        setSize();
        // We could re-init stars here, but scaling simply is fine for this effect
    };

    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

export default StarField;