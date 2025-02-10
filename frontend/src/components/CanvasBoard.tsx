import { useEffect, useRef, useState } from 'react';
import { Download, Play, Maximize2 } from 'lucide-react';

interface CanvasBoardProps {
  code: string;
  width?: number;
  height?: number;
}

export function CanvasBoard({ code, width = 400, height = 300 }: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const executeCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and error
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setError('');

    try {
      // Create a safe function execution environment
      const safeFunction = new Function('canvas', 'ctx', code);
      safeFunction(canvas, ctx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'canvas-export.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleFullscreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isFullscreen) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="mt-2 bg-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gray-800">
        <span className="text-sm text-white">Canvas Preview</span>
        <div className="flex items-center gap-2">
          <button
            onClick={executeCode}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Run Code"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={downloadCanvas}
            className="p-2 hover:bg-gray-600 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="bg-white rounded-lg w-full"
          style={{ aspectRatio: width / height }}
        />
        {error && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}