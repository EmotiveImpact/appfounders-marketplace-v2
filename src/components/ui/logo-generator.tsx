import React, { useRef, useEffect } from 'react';

interface LogoGeneratorProps {
  variant?: 'brackets' | 'code-tags';
  width?: number;
  height?: number;
}

/**
 * This component can be used to generate a PNG version of the logo
 * by rendering it to a canvas and then downloading it.
 */
const LogoGenerator: React.FC<LogoGeneratorProps> = ({ 
  variant = 'code-tags',
  width = 32,
  height = 32
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#4F46E5'; // Indigo-600
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 4);
    ctx.fill();

    if (variant === 'code-tags') {
      // Draw </> text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('</>', width / 2, height / 2);
    } else {
      // Draw code brackets
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Left bracket
      ctx.beginPath();
      ctx.moveTo(width * 0.375, height * 0.875);
      ctx.lineTo(width * 0.125, height * 0.5);
      ctx.lineTo(width * 0.375, height * 0.125);
      ctx.stroke();
      
      // Right bracket
      ctx.beginPath();
      ctx.moveTo(width * 0.625, height * 0.125);
      ctx.lineTo(width * 0.875, height * 0.5);
      ctx.lineTo(width * 0.625, height * 0.875);
      ctx.stroke();
    }
  }, [variant, width, height]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'appfounders-logo.png';
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        className="border border-gray-300 rounded-md"
      />
      <button 
        onClick={downloadImage}
        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        Download Logo
      </button>
    </div>
  );
};

export default LogoGenerator;
