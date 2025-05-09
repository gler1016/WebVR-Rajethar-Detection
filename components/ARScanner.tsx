import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import { loadModel } from '../utils/loadModel';
import { detectRadiator } from '../utils/detectRadiator';
import CalibrationOverlay from './CalibrationOverlay';
import MeasurementBox from './MeasurementBox';

const ARScanner = () => {
  const [model, setModel] = useState<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [calibrationStep, setCalibrationStep] = useState<number>(0); // 0: Start, 1: Calibration complete, 2: Measuring
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 }
    });
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
      tensor = tf.image.resizeBilinear(tensor, [640, 640]);
      tensor = tensor.toFloat().div(255.0);
      tensor = tensor.expandDims(0);  
      return tensor;
    });

    try {
      const results = await detectRadiator(model, inputTensor);
      inputTensor.dispose();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      setPredictions(results);

      // Update calibration step based on results
      if (results.length > 0 && calibrationStep === 0) {
        setCalibrationStep(1); // Calibration complete
      }
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

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageSrc(imageUrl);
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream?.getTracks();
        tracks?.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      const image = new Image();
      image.src = imageUrl;
      image.onload = async () => {
        if (!canvasRef.current || !model) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image, 0, 0);

        const inputTensor = tf.tidy(() => {
          let tensor = tf.browser.fromPixels(image);
          tensor = tf.image.resizeBilinear(tensor, [640, 640]);
          tensor = tensor.toFloat().div(255.0);
          tensor = tensor.expandDims(0);       // Add batch dimension -> [1, 3, 640, 640]
          
          return tensor;
        });

        try {
          const results = await detectRadiator(model, inputTensor);
          inputTensor.dispose();
          setPredictions(results);

          // Update calibration step based on results
          if (results.length > 0 && calibrationStep === 0) {
            setCalibrationStep(1); // Calibration complete
          }
        } catch (err) {
          console.error('Detection error:', err);
        }
      };
    }
  };

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
    if (calibrationStep === 2) return "Start measuring with the calibrated object.";
    return "Calibration error.";
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = () => {
    if (!canvasRef.current || !predictions.length) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    predictions.forEach(prediction => {
      if (prediction.class === 'radiator') {
        const [x, y, width, height] = prediction.bbox;
        const scaleX = canvas.width / videoRef.current?.videoWidth!;
        const scaleY = canvas.height / videoRef.current?.videoHeight!;
        
        context.strokeStyle = '#FF0000';
        context.lineWidth = 2;
        context.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
        context.fillStyle = '#FF0000';
        context.fillText(
          `Radiator (${Math.round(prediction.score * 100)}%)`,
          x * scaleX,
          y * scaleY - 5
        );
      }
    });
  };

  // Call this method when predictions are updated
  useEffect(() => {
    drawBoundingBoxes();
  }, [predictions]);

  return (
    <div className="scanner-container">
      {/* Image upload input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}
      />
      
      {imageSrc && <img src={imageSrc} alt="Uploaded Image" style={{ display: 'none' }} />}
      
      {/* Video feed for webcam or uploaded image */}
      {!imageSrc && <video ref={videoRef} autoPlay playsInline className="camera-feed" />}
      <canvas ref={canvasRef} className="canvas-overlay" />

      {/* Calibration Overlay Message */}
      <div className="calibration-overlay">
        <div className="calibration-instructions">
          {renderCalibrationMessage()}
        </div>
      </div>

      {/* Optional Overlays */}
      <CalibrationOverlay predictions={predictions} calibrationStep={calibrationStep} />
      <MeasurementBox predictions={predictions} />

      {/* JSON Export Button */}
      <button onClick={downloadPredictionsAsJSON} className="download-btn">
        Download Bounding Boxes (JSON)
      </button>
    </div>
  );
};

export default ARScanner;
