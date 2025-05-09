import React from 'react';

interface CalibrationOverlayProps {
  predictions: any[];
  calibrationStep: number;
}

const CalibrationOverlay: React.FC<CalibrationOverlayProps> = ({ predictions, calibrationStep }) => {
  if (calibrationStep === 0) {
    return (
      <div className="calibration-instructions">
        Please place a known object in view for calibration
      </div>
    );
  }

  if (calibrationStep === 1) {
    return (
      <div className="calibration-instructions">
        Calibration complete! You can now begin measuring.
      </div>
    );
  }

  return (
    <div className="calibration-overlay">
      {predictions.map((prediction, index) => {
        const [x, y, width, height] = prediction.bbox;
        return (
          <div
            key={index}
            className="bounding-box"
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: '2px solid red',
            }}
          />
        );
      })}
    </div>
  );
};

export default CalibrationOverlay;
