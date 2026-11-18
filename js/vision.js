export class RobotVision {
  constructor(onTargetMove) {
    this.onTargetMove = onTargetMove; // Callback que recibe {x, y} entre -1 y 1
    this.video = document.createElement('video');
    this.video.autoplay = true;
    this.video.playsInline = true;

    this.canvas = document.createElement('canvas');
    this.width = 64;
    this.height = 48;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

    this.prevFrame = null;
    this.isRunning = false;
  }

  async start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 240, facingMode: "user" } 
      });
      this.video.srcObject = stream;
      this.isRunning = true;
      this.processLoop();
      return true;
    } catch (err) {
      console.error("No se pudo acceder a la cámara:", err);
      return false;
    }
  }

  processLoop() {
    if (!this.isRunning) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.ctx.drawImage(this.video, 0, 0, this.width, this.height);
      const currentFrame = this.ctx.getImageData(0, 0, this.width, this.height).data;

      if (this.prevFrame) {
        let sumX = 0;
        let sumY = 0;
        let changedPixels = 0;

        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const i = (y * this.width + x) * 4;
            // Diferencia de brillo entre fotograma actual y anterior
            const diff = Math.abs(currentFrame[i] - this.prevFrame[i]) +
                         Math.abs(currentFrame[i+1] - this.prevFrame[i+1]) +
                         Math.abs(currentFrame[i+2] - this.prevFrame[i+2]);

            if (diff > 90) { // Umbral de sensibilidad de movimiento
              sumX += x;
              sumY += y;
              changedPixels++;
            }
          }
        }

        // Si hay movimiento suficiente, calcular coordenadas normalizadas (-1 a 1)
        if (changedPixels > 15) {
          const avgX = sumX / changedPixels;
          const avgY = sumY / changedPixels;

          // Invertimos X porque la cámara actúa como espejo
          const normX = -((avgX / this.width) * 2 - 1);
          const normY = (avgY / this.height) * 2 - 1;

          this.onTargetMove(normX, normY);
        }
      }

      this.prevFrame = new Uint8ClampedArray(currentFrame);
    }

    requestAnimationFrame(() => this.processLoop());
  }
}
