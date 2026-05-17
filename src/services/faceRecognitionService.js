const tf = require('@tensorflow/tfjs');
const wasm = require('@tensorflow/tfjs-backend-wasm');
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');
const { Canvas, Image } = require('canvas');
const path = require('path');

// Monkey patch faceapi to use canvas in Node
faceapi.env.monkeyPatch({ Canvas, Image });

let isInitialized = false;
let initPromise = null;

async function initialize() {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("[FaceAPI] Initializing WASM backend...");
    await tf.setBackend('wasm');
    await tf.ready();
    console.log("[FaceAPI] Backend ready: " + tf.getBackend());
    
    console.log("[FaceAPI] Loading models...");
    const modelPath = path.resolve(__dirname, '../../frontend/public/models');
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    console.log("[FaceAPI] Models loaded successfully!");
    isInitialized = true;
  })();

  return initPromise;
}

/**
 * Extract face descriptor from an image buffer
 * @param {Buffer} imageBuffer 
 * @returns {Promise<Array<number>|null>} - Array of 128 floats or null if no face found
 */
async function extractDescriptor(imageBuffer) {
  await initialize();

  try {
    // Create an image object from the buffer using canvas Image
    const img = new Image();
    img.src = imageBuffer;

    // Draw the image on a canvas
    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    // Run face-api to detect single face and extract descriptor
    const detection = await faceapi.detectSingleFace(canvas)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return null;
    }

    // Convert Float32Array to standard JS Array
    return Array.from(detection.descriptor);
  } catch (error) {
    console.error("[FaceAPI] Error in extractDescriptor:", error);
    throw error;
  }
}

module.exports = {
  initialize,
  extractDescriptor
};
