// components/CalibrationOverlay.tsx

import React from 'react';

const CalibrationOverlay = ({ predictions }: { predictions: any[] }) => {
  if (predictions.length === 0) {
    return <div className="calibration-instructions">Place a known object for calibration</div>;
  }

  return (
    <div className="calibration-overlay">
      {predictions.map((prediction, index) => (
        <div
          key={index}
          className="bounding-box"
          style={{
            left: `${prediction[0]}px`,
            top: `${prediction[1]}px`,
            width: `${prediction[2] - prediction[0]}px`,
            height: `${prediction[3] - prediction[1]}px`,
          }}
        />
      ))}
    </div>
  );
};

export default CalibrationOverlay;
