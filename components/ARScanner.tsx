import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadModel } from '../utils/loadModel';
import { detectRadiator } from '../utils/detectRadiator';
import CalibrationOverlay from './CalibrationOverlay';
import MeasurementBox from './MeasurementBox';

const ARScanner = () => {
  const [model, setModel] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load model and start camera on initial load
  useEffect(() => {
    const init = async () => {
      const loadedModel = await loadModel();
      setModel(loadedModel);
      startCamera();
    };
    init();
  }, []);

  // Start camera stream
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // Process each video frame
  const handleVideoFrame = async () => {
    if (!videoRef.current || !model) return;

    const videoFrame = videoRef.current;

    // Convert video frame to tensor
    let tensor = tf.browser.fromPixels(videoFrame);

    // Resize to model input shape: [224, 224, 3]
    tensor = tf.image.resizeBilinear(tensor, [224, 224]);

    // Normalize: scale pixel values to [0, 1]
    tensor = tensor.div(255.0);

    // Expand to batch size of 1: [224, 224, 3] → [1, 224, 224, 3]
    tensor = tensor.expandDims(0);

    // Run inference
    const detectedRadiators = await detectRadiator(model, tensor);

    // Update predictions
    setPredictions(detectedRadiators);

    // Continue processing frames
    requestAnimationFrame(handleVideoFrame);
  };

  // Initialize video frame handler once model is ready
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadeddata = handleVideoFrame;
    }
  }, [model]);

  return (
    <div className="scanner-container">
      <video ref={videoRef} autoPlay playsInline className="camera-feed" />
      <canvas ref={canvasRef} className="canvas-overlay" />
      <CalibrationOverlay predictions={predictions} />
      <MeasurementBox predictions={predictions} />
    </div>
  );
};

export default ARScanner;
