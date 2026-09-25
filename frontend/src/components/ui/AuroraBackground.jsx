import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const AuroraBackground = ({ 
  children, 
  className = "",
  showRadialGradient = true,
  variant = "default" // default, green, blue, multi
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const colors = {
      default: [
        { r: 34, g: 197, b: 94, a: 0.3 },   // green-500
        { r: 59, g: 130, b: 246, a: 0.25 }, // blue-500
        { r: 168, g: 85, b: 247, a: 0.2 }   // purple-500
      ],
      green: [
        { r: 22, g: 163, b: 74, a: 0.35 },  // organic-green-600
        { r: 34, g: 197, b: 94, a: 0.3 },   // green-500
        { r: 132, g: 204, b: 22, a: 0.25 }  // lime-500
      ],
      blue: [
        { r: 37, g: 99, b: 235, a: 0.3 },   // blue-600
        { r: 59, g: 130, b: 246, a: 0.25 }, // blue-500
        { r: 14, g: 165, b: 233, a: 0.2 }   // sky-500
      ],
      multi: [
        { r: 34, g: 197, b: 94, a: 0.3 },   // green
        { r: 251, g: 191, b: 36, a: 0.25 }, // amber
        { r: 59, g: 130, b: 246, a: 0.2 }   // blue
      ]
    };

    const selectedColors = colors[variant] || colors.default;

    const drawAurora = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create multiple aurora waves
      selectedColors.forEach((color, index) => {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2 + Math.sin(time * 0.001 + index) * 200,
          canvas.height / 2 + Math.cos(time * 0.0015 + index) * 150,
          0,
          canvas.width / 2,
          canvas.height / 2,
          canvas.width * 0.8
        );

        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      time += 16;
      animationFrameId = requestAnimationFrame(drawAurora);
    };

    drawAurora();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant]);

  return (
    <div className={`relative ${className}`}>
      {/* Aurora Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Radial Gradient Overlay */}
      {showRadialGradient && (
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0, 0, 0, 0.4) 100%)`
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default AuroraBackground;
