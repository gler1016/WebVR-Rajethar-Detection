'use client';
import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const ARScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load TensorFlow.js COCO-SSD model
  useEffect(() => {
    cocoSsd.load().then(setModel).catch(() => setError('Failed to load detection model'));
  }, []);

  // Camera setup
  useEffect(() => {
    const getCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError('Camera access denied or not available.');
      }
    };
    getCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Detection loop
  useEffect(() => {
    let animationId: number;
    let isMounted = true;
    const detectFrame = async () => {
      if (!model || !videoRef.current || !canvasRef.current) {
        setLoading(true);
        animationId = requestAnimationFrame(detectFrame);
        return;
      }
      setLoading(false);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (video.readyState === 4) {
        const predictions = await model.detect(video);
        // Find radiator-like objects (COCO-SSD may not have a radiator class, so use 'radiator' or fallback to 'bench', 'tv', etc. for demo)
        const radiatorPreds = predictions.filter(pred =>
          pred.class.toLowerCase().includes('radiator') ||
          pred.class.toLowerCase().includes('bench') ||
          pred.class.toLowerCase().includes('tv')
        );
        radiatorPreds.forEach(pred => {
          // Draw orange outline
          ctx.save();
          ctx.strokeStyle = 'orange';
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.rect(...pred.bbox);
          ctx.stroke();
          ctx.restore();
          // Draw label
          ctx.save();
          ctx.font = '18px Arial';
          ctx.fillStyle = 'orange';
          ctx.fillText('Radiator?', pred.bbox[0], pred.bbox[1] - 8);
          ctx.restore();
        });
      }
      animationId = requestAnimationFrame(detectFrame);
    };
    animationId = requestAnimationFrame(detectFrame);
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
    };
  }, [model]);

  return (
    <div className="relative w-full max-w-2xl h-96 bg-black rounded-lg overflow-hidden flex items-center justify-center">
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        width={640}
        height={384}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={384}
        className="absolute w-full h-full pointer-events-none"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 text-white text-lg font-semibold z-10">
          Loading AR Scanner...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-700 bg-opacity-80 text-white text-lg font-semibold z-20">
          {error}
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
        Point your camera at the radiator and reference card
      </div>
    </div>
  );
};

export default ARScanner; 
