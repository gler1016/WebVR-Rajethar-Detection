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
  const [calibrationStep, setCalibrationStep] = useState<number>(0); // Placeholder for future logic

  // Load model and start camera
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

  // Start webcam stream
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  // Handle each video frame for detection
  const handleVideoFrame = async () => {
    if (!videoRef.current || !model || !canvasRef.current) return;

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

    const inputTensor = tf.tidy(() => {
      let tensor = tf.browser.fromPixels(video);
      tensor = tf.image.resizeBilinear(tensor, [224, 224]);
      tensor = tensor.div(255.0).expandDims(0);
      return tensor;
    });

    try {
      const results = await detectRadiator(model, inputTensor);
      inputTensor.dispose();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPredictions(results);
    } catch (err) {
      console.error('Detection error:', err);
    }

    requestAnimationFrame(handleVideoFrame);
  };

  // Begin detection loop once video is ready
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.onloadeddata = handleVideoFrame;
    }
  }, [model]);

  // Download prediction results as JSON
  const downloadPredictionsAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(predictions, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", "radiator_predictions.json");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Calibration instruction text
  const renderCalibrationMessage = () => {
    if (calibrationStep === 0) return "Please position the object for calibration.";
    if (calibrationStep === 1) return "Calibration complete! Start measuring.";
    return "Calibration error.";
  };

  return (
    <div className="scanner-container">
      <video ref={videoRef} autoPlay playsInline className="camera-feed" />
      <canvas ref={canvasRef} className="canvas-overlay" />

      {/* Calibration Overlay Message */}
      <div className="calibration-overlay">
        <div className="calibration-instructions">
          {renderCalibrationMessage()}
        </div>
      </div>

      {/* Render Bounding Boxes */}
      {predictions.map((prediction, index) => {
        if (prediction.class === 'radiator') {
          const [x, y, width, height] = prediction.bbox;
          return (
            <div
              key={index}
              className="bounding-box"
              style={{
                left: `${x}px`,
                top: `${y}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              <div className="measurement-info">
                {prediction.class} ({Math.round(prediction.score * 100)}%)
              </div>
            </div>
          );
        }
        return null;
      })}

      {/* Optional Overlays */}
      <CalibrationOverlay predictions={predictions} />
      <MeasurementBox predictions={predictions} />

      {/* JSON Export Button */}
      <button onClick={downloadPredictionsAsJSON} className="download-btn">
        Download Bounding Boxes (JSON)
      </button>
    </div>
  );
};

export default ARScanner;
