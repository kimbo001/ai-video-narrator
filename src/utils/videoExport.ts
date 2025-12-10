import { Scene } from '../types';

export interface ExportOptions {
  quality: '1080p' | '720p';
  fps: 24 | 30;
}

export const exportVideo = async (scenes: Scene[], options: ExportOptions): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const { width, height } = options.quality === '1080p' 
    ? { width: 1920, height: 1080 }
    : { width: 1280, height: 720 };
    
  canvas.width = width;
  canvas.height = height;

  return new Promise(async (resolve, reject) => {
    try {
      const stream = canvas.captureStream(options.fps);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: options.quality === '1080p' ? 4000000 : 2000000,
      });

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        resolve(new Blob(chunks, { type: 'video/webm' }));
      };

      mediaRecorder.start(100);

      // Process scenes smoothly
      for (const scene of scenes) {
        if (scene.mediaUrl) {
          const img = await loadImage(scene.mediaUrl);
          const duration = scene.duration || 3000;
          const frameCount = Math.ceil(duration / 1000 * 30);
          
          for (let frame = 0; frame < frameCount; frame++) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Simple centered scaling
            const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;
            
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            await new Promise(resolve => setTimeout(resolve, 33)); // ~30fps
          }
        }
      }

      mediaRecorder.stop();
      stream.getTracks().forEach(track => track.stop());

    } catch (error) {
      reject(error);
    }
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
