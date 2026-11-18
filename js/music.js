export class RobotMusic {
  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
    this.baseVolume = 0.5;
    this.audio.volume = this.baseVolume;
    this.currentIndex = 0;
    this.isPlaying = false;

    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;

    this.playlist = [
      { name: "música de ataque", url: "./music/ataque.mp3" },
      { name: "rock", url: "./music/rock.mp3" },
      { name: "radio 100", url: "https://27603.live.streamtheworld.com/FM999_56AAC.aac?dist=la100_other_app_webplayer&tdsdk=js-2.9&swm=false&pname=TDSdk&pversion=2.9&banners=none&burst-time=15&sbmid=f61a5b5c-d1be-451b-9781-9ca85fb60bb1" },
      { name: "radio electrónica", url: "https://zeno.fm" }
    ];

    this.audio.addEventListener('ended', () => this.next());
  }

  initAnalyzer() {
    if (this.audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();
    
    const source = this.audioCtx.createMediaElementSource(this.audio);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    
    source.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  play(query = "") {
    this.initAnalyzer();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (query) {
      const foundIndex = this.playlist.findIndex(track => 
        query.includes(track.name) || track.name.includes(query)
      );
      if (foundIndex !== -1) this.currentIndex = foundIndex;
    }

    const track = this.playlist[this.currentIndex];
    this.audio.src = track.url;
    this.audio.play()
      .then(() => { this.isPlaying = true; })
      .catch(err => console.error("Error al reproducir audio:", err));

    return track.name;
  }

  stop() {
    this.audio.pause();
    this.isPlaying = false;
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    return this.play();
  }

  changeVolume(delta) {
    this.baseVolume = Math.min(1.0, Math.max(0.1, this.baseVolume + delta));
    this.audio.volume = this.baseVolume;
    return Math.round(this.baseVolume * 100);
  }

  duckVolume(isSpeaking) {
    if (this.isPlaying) {
      this.audio.volume = isSpeaking ? Math.min(0.1, this.baseVolume) : this.baseVolume;
    }
  }

  getBeatEnergy() {
    if (!this.isPlaying || !this.analyser) return 0;
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // AQUÍ ESTABA EL ERROR: Faltaban los índices, [1], [2] y [3]
    const bass = (this.dataArray[0] + this.dataArray[1] + this.dataArray[2] + this.dataArray[3]) / 4;
    return bass / 255;
  }
}
