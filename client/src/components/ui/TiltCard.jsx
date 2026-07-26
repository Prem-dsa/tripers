import { useRef, useEffect } from 'react';

export function TiltCard({ children, maxTilt = 8, scale = 1.015, className = '' }) {
  const containerRef = useRef(null);
  const glareRef = useRef(null);

  useEffect(() => {
    const card = containerRef.current;
    const glare = glareRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate rotations (-maxTilt to maxTilt degrees)
      const rotateX = ((centerY - y) / centerY) * maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      // Apply transforms
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
      card.style.transition = 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)';

      // Update light glare reflection position
      if (glare) {
        const pctX = (x / rect.width) * 100;
        const pctY = (y / rect.height) * 100;
        glare.style.background = `radial-gradient(circle at ${pctX}% ${pctY}%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)`;
        glare.style.opacity = '1';
        glare.style.transition = 'opacity 0.2s ease';
      }
    };

    const handleMouseLeave = () => {
      // Smoothly reset transformations on leave
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';

      if (glare) {
        glare.style.opacity = '0';
        glare.style.transition = 'opacity 0.5s ease';
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [maxTilt, scale]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* 3D glare light overlay */}
      <div
        ref={glareRef}
        className="absolute inset-0 pointer-events-none opacity-0 z-50 rounded-[inherit]"
      />
      <div style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </div>
  );
}
