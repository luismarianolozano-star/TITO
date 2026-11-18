// Función matemática para movimiento suave constante
const lerp = (start, end, factor) => start + (end - start) * factor;

// Definición de parámetros por emoción
const EMOTIONS = {
  neutral:   { browAngle: 0,    browY: 0,   eyeOpen: 1,   mouthCurve: 0,   mouthWidth: 100 },
  happy:     { browAngle: -0.1, browY: -10, eyeOpen: 0.8, mouthCurve: 45,  mouthWidth: 130 },
  angry:     { browAngle: 0.35, browY: 15,  eyeOpen: 0.7, mouthCurve: -30, mouthWidth: 90 },
  surprised: { browAngle: -0.2, browY: -25, eyeOpen: 1.3, mouthCurve: 10,  mouthWidth: 60 }
};

export class RobotFace {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.current = { 
      ...EMOTIONS.neutral, 
      pupilX: 0, 
      pupilY: 0, 
      mouthOpen: 0, 
      blink: 1, 
      beat: 0 
    };

    this.target = { 
      ...EMOTIONS.neutral, 
      pupilX: 0, 
      pupilY: 0, 
      mouthOpen: 0, 
      blink: 1, 
      beat: 0 
    };

    this.isSpeaking = false;
    this.time = 0;
    this.nextBlink = 2000;
    this.lastTrackingTime = 0;
  }

  setEmotion(emotionName) {
    if (EMOTIONS[emotionName]) {
      Object.assign(this.target, EMOTIONS[emotionName]);
    }
  }

  setSpeaking(speaking) {
    this.isSpeaking = speaking;
  }

  lookAt(normX, normY) {
    this.target.pupilX = normX * 22;
    this.target.pupilY = normY * 14;
    this.lastTrackingTime = this.time;
  }

  // Amplificamos la señal de los graves para que el baile sea bien visible
  setBeat(energy) {
    if (energy > 0.15) {
      // Elevamos al cuadrado o multiplicamos para exagerar los golpes fuertes
      this.target.beat = Math.min(1.5, energy * 1.6);
    } else {
      this.target.beat = 0;
    }
  }

  update(deltaTime) {
    this.time += deltaTime;

    // 1. Mirada autónoma si no hay movimiento en cámara
    if (!this.lastTrackingTime || (this.time - this.lastTrackingTime > 3000)) {
      this.target.pupilX = Math.sin(this.time * 0.0015) * 12;
      this.target.pupilY = Math.cos(this.time * 0.001) * 6;
    }

    // 2. Parpadeo aleatorio automático
    this.nextBlink -= deltaTime;
    if (this.nextBlink <= 0) {
      this.target.blink = 0.05;
      if (this.nextBlink <= -150) {
        this.target.blink = 1;
        this.nextBlink = 2000 + Math.random() * 4000;
      }
    }

    // 3. Animación de boca al hablar
    if (this.isSpeaking) {
      this.target.mouthOpen = (Math.sin(this.time * 0.025) + 1) * 18 + Math.random() * 10;
    } else {
      this.target.mouthOpen = 0;
    }

    // 4. Suavizado constante (Lerp)
    const smooth = 0.12;
    for (let key in this.target) {
      // Velocidad alta (0.6) para el ritmo musical para que reaccione al instante
      let speed = smooth;
      if (key === 'blink' || key === 'mouthOpen') speed = 0.35;
      if (key === 'beat') speed = 0.6;

      this.current[key] = lerp(this.current[key], this.target[key], speed);
    }
  }

  draw() {
    const { ctx, canvas, current } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Balanceo rítmico de toda la cabeza cuando hay música
    const headBobY = current.beat * 12;
    const headSwayX = Math.sin(this.time * 0.008) * (current.beat * 18);

    const cx = (canvas.width / 2) + headSwayX;
    const cy = (canvas.height / 2 - 30) + headBobY;
    const eyeOffsetX = 110;

    ctx.strokeStyle = '#00e5ff';
    ctx.fillStyle = '#00e5ff';
    ctx.lineCap = 'round';

    // Dibujar ambos ojos
    [-1, 1].forEach(side => {
      const ex = cx + side * eyeOffsetX;
      const ey = cy - 40;
      const radiusY = 45 * current.eyeOpen * current.blink;

      // Contorno del ojo
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 45, Math.max(2, radiusY), 0, 0, Math.PI * 2);
      ctx.stroke();

      // Pestañas superiores
      if (current.blink > 0.3) {
        ctx.lineWidth = 4;
        [-0.4, 0, 0.4].forEach(angleOffset => {
          const angle = -Math.PI / 2 + angleOffset;
          const lx1 = ex + Math.cos(angle) * 45;
          const ly1 = ey + Math.sin(angle) * radiusY;
          const lx2 = ex + Math.cos(angle) * 58;
          const ly2 = ey + Math.sin(angle) * (radiusY + 14);
          ctx.beginPath();
          ctx.moveTo(lx1, ly1);
          ctx.lineTo(lx2, ly2);
          ctx.stroke();
        });
      }

      // Pupila (pulsa con más fuerza)
      if (current.blink > 0.25) {
        const beatScale = 1 + current.beat * 0.45;
        ctx.beginPath();
        ctx.arc(
          ex + current.pupilX,
          ey + current.pupilY * current.blink,
          16 * beatScale * Math.min(1, current.blink),
          0, Math.PI * 2
        );
        ctx.fill();
      }

      // Cejas expresivas (salto e inclinación mucho más marcados)
      const danceBounce = current.beat * -45;
      ctx.save();
      ctx.translate(ex, ey - 70 + current.browY + danceBounce);
      ctx.rotate((current.browAngle - current.beat * 0.28) * side);
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.lineTo(42, 0);
      ctx.stroke();
      ctx.restore();
    });

    // Nariz minimalista
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 10);
    ctx.lineTo(cx - 12, cy + 45);
    ctx.lineTo(cx + 8, cy + 45);
    ctx.stroke();

    // Boca dinámica (sonríe ligeramente al ritmo si no está hablando)
    const my = cy + 115;
    const mw = current.mouthWidth + (current.beat * 15);
    const danceSmile = current.isSpeaking ? 0 : current.beat * 20;
    ctx.lineWidth = 7;

    // Labio superior
    ctx.beginPath();
    ctx.moveTo(cx - mw, my);
    ctx.quadraticCurveTo(cx, my + current.mouthCurve + danceSmile - current.mouthOpen * 0.4, cx + mw, my);
    ctx.stroke();

    // Labio inferior
    ctx.beginPath();
    ctx.moveTo(cx - mw, my);
    ctx.quadraticCurveTo(cx, my + current.mouthCurve + danceSmile + current.mouthOpen, cx + mw, my);
    ctx.stroke();
  }
}
