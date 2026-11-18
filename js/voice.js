export class RobotVoice {
  constructor(onSpeakingChange) {
    this.synth = window.speechSynthesis;
    this.onSpeakingChange = onSpeakingChange;
  }

  speak(text) {
    if (this.synth.speaking) {
      this.synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-AR'; // Español (puedes cambiar a es-ES o es-MX)
    utterance.pitch = 1.1;    // Tono ligeramente robótico/amigable
    utterance.rate = 1.05;

    utterance.onstart = () => this.onSpeakingChange(true);
    utterance.onend = () => this.onSpeakingChange(false);
    utterance.onerror = () => this.onSpeakingChange(false);

    this.synth.speak(utterance);
  }
}
