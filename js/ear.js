export class RobotEar {
  constructor(wakeWord, onCommandDetected, onStatusChange) {
    this.wakeWord = wakeWord.toLowerCase();
    this.onCommandDetected = onCommandDetected;
    this.onStatusChange = onStatusChange;
    this.isListening = false;
    this.isPaused = false; // Para silenciarlo mientras el robot habla

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz. Usa Google Chrome.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'es-AR';
    this.recognition.continuous = true;     // Escucha continua
    this.recognition.interimResults = false; // Solo frases completas

    this.setupEvents();
  }

  setupEvents() {
    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStatusChange) this.onStatusChange(true);
    };

    this.recognition.onresult = (event) => {
      // Tomar la última frase detectada
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
      
      console.log("Escuchado:", transcript);

      // Verificar si dijiste el nombre del robot
      if (transcript.includes(this.wakeWord)) {
        // Extraer lo que dijiste después de "tito"
        const parts = transcript.split(this.wakeWord);
        const command = parts[parts.length - 1].trim();
        
        this.onCommandDetected(command);
      }
    };

    // Reiniciar automáticamente si el navegador corta la escucha por silencio
    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStatusChange) this.onStatusChange(false);

      if (!this.isPaused) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {
            // Evitar error si ya estaba iniciando
          }
        }, 300);
      }
    };

    this.recognition.onerror = (event) => {
        // Ignorar el aviso normal cuando hay silencio prolongado
      if (event.error !== 'no-speech') {
      console.warn("Error de micrófono:", event.error);
      }
    };
  }

  start() {
    this.isPaused = false;
    if (!this.isListening) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn(e);
      }
    }
  }

  pause() {
    this.isPaused = true;
    this.recognition.stop();
  }
}
