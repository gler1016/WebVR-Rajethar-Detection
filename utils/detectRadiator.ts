import * as tf from '@tensorflow/tfjs';

export async function detectRadiator(model: any, imageTensor: tf.Tensor) {
  // Run inference
  const predictions = model.execute(imageTensor) as tf.Tensor[];

  // Unpack tensors
  const [boxesTensor, classesTensor, scoresTensor] = predictions;

  // Convert tensors to arrays
  const boxes = await boxesTensor.array() as number[][];     // shape: [numDetections, 4]
  const classes = await classesTensor.array() as number[];    // shape: [numDetections]
  const scores = scoresTensor ? await scoresTensor.array() as number[] : undefined; // optional: confidence scores

  // Ensure that boxes, classes, and scores are arrays
  const results: any[] = [];

  if (Array.isArray(boxes) && Array.isArray(classes)) {
    for (let i = 0; i < boxes.length; i++) {
      const classId = classes[i];
      const score = scores ? scores[i] : 1.0;

      // Filter only radiators with confidence > threshold (e.g., 0.5)
      if (classId === 1 && score > 0.5) {
        results.push({
          class: 'radiator',
          bbox: boxes[i],  // [x, y, width, height]
          score,
        });
      }
    }
  }

  // Clean up
  tf.dispose([boxesTensor, classesTensor, scoresTensor]);

  return results;
}
