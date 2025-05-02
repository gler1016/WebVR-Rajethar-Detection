import { calibrate } from './calibrate';

export function measure(boundingBox: any, imageWidth: number, imageHeight: number, scale: any) {
  const pixelWidth = boundingBox[2] - boundingBox[0]; // xmin to xmax
  const pixelHeight = boundingBox[3] - boundingBox[1]; // ymin to ymax

  const width = pixelWidth * scale.scaleWidth;
  const height = pixelHeight * scale.scaleHeight;

  // Assuming depth is proportional to width (you can modify this based on your scenario)
  const depth = width * 0.8; // Adjust factor as necessary

  return { width, height, depth };
}
