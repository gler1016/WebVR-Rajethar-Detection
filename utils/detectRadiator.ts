import * as tf from '@tensorflow/tfjs';

export async function detectRadiator(model: tf.GraphModel, imageTensor: tf.Tensor) {
  // Run inference
  const predictions = model.execute(imageTensor) as tf.Tensor;

  // Log the predictions tensor shape for debugging
  console.log('Predictions Shape:',results);  // This should log [1, 5, 8400]

  // Check if predictions is a tensor with the expected shape
  if (predictions.shape.length !== 3 || predictions.shape[1] !== 5) {
    throw new Error("Expected predictions tensor to have shape [1, 5, numDetections], but got: " + predictions.shape);
  }

  // Remove batch dimension (squeeze) so that the tensor shape becomes [5, 8400]
  const predictionsArray = predictions.squeeze();

  // Extracting boxes, class ids, and scores
  const boxes = predictionsArray.slice([0, 0], [-1, 4]);  // Extract [x, y, width, height] (shape: [8400, 4])
  const classes = predictionsArray.slice([0, 4], [-1, 1]);  // Extract class IDs (shape: [8400, 1])
  const scores = predictionsArray.slice([0, 5], [-1, 1]);  // Extract confidence scores (shape: [8400, 1])

  // Convert tensors to arrays for further processing
  const boxesArray = await boxes.array() as number[][];
  const classesArray = await classes.array() as number[];
  const scoresArray = await scores.array() as number[];

  // Filter results to only keep radiators (classId === 1) with score > 0.5
  const results = [];

  for (let i = 0; i < boxesArray.length; i++) {
    const score = scoresArray[i][0];  // Confidence score is a scalar value
    const classId = classesArray[i][0];  // Class ID is a scalar value

    // Check if the detected object is a radiator (assuming classId 1 represents 'radiator')
    // and if the detection confidence is greater than 0.5
    if (classId === 1 && score > 0.5) {
      results.push({
        class: 'radiator',
        bbox: boxesArray[i],  // Bounding box [x, y, width, height]
        score,  // Confidence score
      });
    }
  }

  // Clean up tensors to free memory
  tf.dispose([predictions, boxes, classes, scores]);

  // Return the filtered results
  return results;
}
