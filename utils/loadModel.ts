// utils/loadModel.ts
import * as tf from '@tensorflow/tfjs';

export async function loadModel() {
  const model = await tf.loadGraphModel('/radiator_model/model.json');
  console.log('Model loaded successfully');
  return model;
}
