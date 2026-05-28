import { pipeline, env } from '@huggingface/transformers';

// Skip local model check, use Hugging Face Hub
env.allowLocalModels = false;
// Improve performance
env.useBrowserCache = true;

class PipelineSingleton {
  static task = 'zero-shot-image-classification';
  static model = 'Xenova/clip-vit-base-patch32';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, {
        progress_callback,
        device: 'webgpu', // Try WebGPU first, fall back to wasm
      });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { type, image, categories } = event.data;

  if (type === 'load') {
    // Just load the model in the background
    await PipelineSingleton.getInstance(x => {
      self.postMessage({ status: 'progress', data: x });
    });
    self.postMessage({ status: 'ready' });
    return;
  }

  if (type === 'analyze') {
    try {
      self.postMessage({ status: 'analyzing' });
      
      const classifier = await PipelineSingleton.getInstance();
      
      // Perform zero-shot image classification
      const results = await classifier(image, categories);
      
      self.postMessage({ status: 'complete', results });
    } catch (error) {
      self.postMessage({ status: 'error', error: error.message });
    }
  }
});
