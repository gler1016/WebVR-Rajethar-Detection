// components/MeasurementBox.tsx

import React from 'react';

const MeasurementBox = ({ predictions }: { predictions: any[] }) => {
  if (predictions.length === 0) return null;

  return (
    <div className="measurement-box">
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
        >
          <span className="measurement-info">
            Width: {Math.round(prediction[2] - prediction[0])} mm
            Height: {Math.round(prediction[3] - prediction[1])} mm
          </span>
        </div>
      ))}
    </div>
  );
};

export default MeasurementBox;
