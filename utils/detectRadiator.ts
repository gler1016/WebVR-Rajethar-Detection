import * as tf from '@tensorflow/tfjs';

export async function detectRadiator(model: any, imageTensor: tf.Tensor) {
  const predictions = await model.executeAsync(imageTensor) as tf.Tensor[];
  const boundingBoxes = predictions[0].arraySync();
  const classLabels = predictions[1].arraySync();

  const radiators = boundingBoxes.filter((box: any, idx: number) => classLabels[idx] === 1); // Assuming "Radiator" class is 1

  return radiators;
}
