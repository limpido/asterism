import React, { useEffect, useState } from 'react';

interface StarStyle {
  id: number;
  top: string;
  left: string;
  rotation: number;
  width: number;
  duration: number;
}

const ShootingStars: React.FC = () => {
  const [currentStar, setCurrentStar] = useState<StarStyle | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const spawnStar = () => {
      // 1. Determine Edge (0: Top, 1: Right, 2: Bottom, 3: Left)
      const edge = Math.floor(Math.random() * 4);
      
      let top = '0%';
      let left = '0%';
      let baseAngle = 0;

      // Random position along the edge (10% to 90% to avoid extreme corners)
      const offset = 10 + Math.random() * 80; 

      switch (edge) {
        case 0: // Top Edge
          top = '-10px';
          left = `${offset}%`;
          baseAngle = 90; // Pointing down
          break;
        case 1: // Right Edge
          top = `${offset}%`;
          left = 'calc(100% + 10px)';
          baseAngle = 180; // Pointing left
          break;
        case 2: // Bottom Edge
          top = 'calc(100% + 10px)';
          left = `${offset}%`;
          baseAngle = 270; // Pointing up
          break;
        case 3: // Left Edge
          top = `${offset}%`;
          left = '-10px';
          baseAngle = 0; // Pointing right
          break;
      }

      // Add randomness to angle (+/- 30 degrees)
      const rotation = baseAngle + (Math.random() * 60 - 30);

      // 2. Determine Properties
      // Smaller size: 50px to 100px
      const width = 50 + Math.random() * 50; 
      
      // Speed Update: Distance is now much longer (200vmax), so duration needs to be longer to maintain "speed".
      // Range: 1.5s to 3.0s
      const duration = 1.5 + Math.random() * 1.5;

      const newStar: StarStyle = {
        id: Date.now(),
        top,
        left,
        rotation,
        width,
        duration,
      };

      setCurrentStar(newStar);

      // 3. Schedule Cleanup and Next Spawn
      // Star stays visible for its duration
      const lifeTime = duration * 1000;
      
      // Wait a random time before the NEXT one appears (e.g., 3s to 8s)
      const nextSpawnDelay = lifeTime + 3000 + Math.random() * 5000;

      setTimeout(() => {
        setCurrentStar(null); // Remove star from DOM after animation
      }, lifeTime);

      timeoutId = setTimeout(spawnStar, nextSpawnDelay);
    };

    // Initial start delay
    timeoutId = setTimeout(spawnStar, 2000);

    return () => clearTimeout(timeoutId);
  }, []);

  if (!currentStar) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full">
        <div 
            key={currentStar.id}
            className="star-wrapper"
            style={{
                top: currentStar.top,
                left: currentStar.left,
                transform: `rotate(${currentStar.rotation}deg)`,
            }}
        >
            <div 
                className="shooting-star" 
                style={{
                    width: `${currentStar.width}px`,
                    animationDuration: `${currentStar.duration}s`
                }} 
            />
        </div>
    </div>
  );
};

export default ShootingStars;