import { WhisperXOptions } from '../types/whisper';

/**
 * Default configuration for WhisperX
 */
export const defaultWhisperConfig: WhisperXOptions = {
  model: 'base', // Model size (tiny, base, small, medium, large)
  device: 'cpu', // Use CPU by default, will use CUDA if available
  batchSize: 16, // Batch size for processing
  computePrecision: 'float32', // Computation precision
  enableHQ: false, // High quality mode (more accurate but slower)
};

/**
 * Environment-specific configuration options
 */
export const whisperEnvConfig = {
  // Path to Python executable
  pythonPath: process.env.WHISPERX_PYTHON_PATH || 'python3',

  // Path to WhisperX models directory (for caching)
  modelsDir: process.env.WHISPERX_MODELS_DIR || './models',

  // Max audio duration to process at once (in seconds)
  maxAudioDuration: parseInt(process.env.WHISPERX_MAX_DURATION || '30', 10),

  // Whether to prefer GPU if available
  preferGPU: process.env.WHISPERX_PREFER_GPU === 'true',

  // Log level for WhisperX
  logLevel: process.env.WHISPERX_LOG_LEVEL || 'info',
};

/**
 * Get device to use based on environment config
 */
export function getDeviceConfig(): 'cpu' | 'cuda' {
  if (whisperEnvConfig.preferGPU) {
    return 'cuda'; // This will fall back to CPU if CUDA not available
  }
  return 'cpu';
}

/**
 * Get WhisperX options with environment overrides
 */
export function getWhisperOptions(): WhisperXOptions {
  return {
    ...defaultWhisperConfig,
    device: getDeviceConfig(),
  };
}

/**
 * Get model path for a specific model
 */
export function getModelPath(model: string): string {
  return `${whisperEnvConfig.modelsDir}/${model}`;
}

/**
 * Available WhisperX models
 */
export const availableModels = [
  { id: 'tiny', name: 'Tiny (39M params)', size: '39M' },
  { id: 'base', name: 'Base (74M params)', size: '74M' },
  { id: 'small', name: 'Small (244M params)', size: '244M' },
  { id: 'medium', name: 'Medium (769M params)', size: '769M' },
  { id: 'large', name: 'Large (1.5B params)', size: '1.5B' },
];

/**
 * Memory requirements per model in GB
 */
export const modelMemoryRequirements = {
  tiny: 1,
  base: 1,
  small: 2,
  medium: 4,
  large: 8,
};
