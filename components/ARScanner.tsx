import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadModel } from '../utils/loadModel';
import { detectRadiator } from '../utils/detectRadiator';
import CalibrationOverlay from './CalibrationOverlay';
import MeasurementBox from './MeasurementBox';

const ARScanner = () => {
  const [model, setModel] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [outputJSON, setOutputJSON] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const init = async () => {
      await tf.setBackend('webgl');
      await tf.ready();
      const loadedModel = await loadModel();
      setModel(loadedModel);
      startCamera();
    };
    init();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const handleVideoFrame = async () => {
    if (!videoRef.current  !model  !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(handleVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;

    const detectedRadiators = tf.tidy(() => {
      let tensor = tf.browser.fromPixels(video);
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);
      tensor = tensor.div(255.0).expandDims(0);
      return tensor;
    });

    try {
      const radiators = await detectRadiator(model, detectedRadiators);
      console.log("Detected Radiators:", radiators);
      detectedRadiators.dispose();

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      radiators.forEach((prediction: any) => {
        if (prediction.class === 'radiator') {
          const [x, y, w, h] = prediction.bbox;

          context.beginPath();
          context.rect(x, y, w, h);
          context.lineWidth = 2;
          context.strokeStyle = 'red';
          context.stroke();

          context.fillStyle = 'red';
          context.font = '16px Arial';
          context.fillText(
            ${prediction.class} (${Math.round(prediction.score * 100)}%),
            x,
            y - 8
          );
        }
      });

      setPredictions(radiators);
      setOutputJSON(JSON.stringify(radiators, null, 2));

    } catch (error) {
      console.error('Error during detection:', error);
    }

    requestAnimationFrame(handleVideoFrame);
  };

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

      <pre
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'lime',
          fontSize: '12px',
          padding: '10px',
          maxHeight: '200px',
          overflow: 'auto',
          width: '100%',
        }}
      >
        {outputJSON}
      </pre>
    </div>
  );
};

export default ARScanner;
