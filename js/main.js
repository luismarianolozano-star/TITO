import { RobotFace } from './face.js';
import { RobotVoice } from './voice.js';
import { RobotEar } from './ear.js';
import { RobotBrain } from './brain.js';
import { RobotVision } from './vision.js';
import { RobotHardware } from './esp32.js';
import { RobotMusic } from './music.js';
import { RobotNews } from './news.js'; // módulo de noticias
import { RobotWeather } from './weather.js'; //clima
import { RobotFaceID } from './faceId.js'; //rostro
import { RobotJokes } from './jokes.js'; //chistes


// ⚠️ CAMBIA ESTA IP POR LA QUE TE MUESTRE EL MONITOR SERIE DE TU ESP32
const ENABLE_ESP32 = false; 
const ESP32_IP = "192.168.1.50"; 

const canvas = document.getElementById('robotCanvas');
const micStatus = document.getElementById('micStatus');
const espStatus = document.getElementById('espStatus');

const face = new RobotFace(canvas);
const brain = new RobotBrain();
const music = new RobotMusic(); // 2. Inicializar reproductor

const news = new RobotNews(); // 2. Inicializar lector de noticias
const weather = new RobotWeather(); //CLIMA
const jokes = new RobotJokes();//chistes


// 1. Inicializar conexión con ESP32
const hardware = new RobotHardware(ESP32_IP, (connected) => {
  espStatus.textContent = connected ? "🟢 ESP32 conectado" : "🔴 ESP32 desconectado";
});

if (ENABLE_ESP32) {
  hardware.connect();
} else {
  espStatus.textContent = "⚪ ESP32 en modo simulación";
}

// 2. Inicializar cámara para seguimiento de ojos
const vision = new RobotVision((normX, normY) => {
  face.lookAt(normX, normY);
});

document.getElementById('btnStartCam').addEventListener('click', async (e) => {
  const ok = await vision.start();
  if (ok) {
    e.target.style.display = 'none';
    titoSpeak("Cámara activada. Ahora puedo verte.", "surprised");
  }
});

// 3. Voz y oído
function titoSpeak(text, emotion = 'happy') {
  face.setEmotion(emotion);
  ear.pause();
  voice.speak(text);
}

const voice = new RobotVoice((isSpeaking) => {
  face.setSpeaking(isSpeaking);
  music.duckVolume(isSpeaking); // 3. Bajar música automáticamente cuando Tito habla
  
  if (!isSpeaking) {
    face.setEmotion('neutral');
    ear.start();
  }
});

// 2. Inicializar reconocimiento facial compartiendo la cámara de 'vision'
const faceId = new RobotFaceID(vision.video, (recognizedName) => {
  // Saludo espontáneo cuando ve a alguien conocido después de un rato
  titoSpeak(`¡Hola ${recognizedName}! Qué bueno verte de nuevo.`, "happy");
});

// Al activar la cámara, iniciamos también la carga de modelos faciales
document.getElementById('btnStartCam').addEventListener('click', async (e) => {
  const ok = await vision.start();
  if (ok) {
    e.target.style.display = 'none';
    titoSpeak("Cámara activada. Cargando reconocimiento facial.", "surprised");
    faceId.loadModels();
  }
});

const ear = new RobotEar(
  "tito",
  async (command) => {
    // Pasamos 'faceId.currentPerson' al cerebro para que sepa con quién habla
    const decision = brain.think(command, faceId.currentPerson);
    titoSpeak(decision.text, decision.emotion);

    // 3. Si le pediste que memorice tu rostro
    if (decision.learnFaceName) {
      const result = await faceId.learnFace(decision.learnFaceName);
      setTimeout(() => {
        titoSpeak(result.msg, result.ok ? "happy" : "surprised");
      }, 1500);
    }
    
    if (decision.action) {
      hardware.sendCommand(decision.action);
    }

     if (decision.fetchJoke) {
      const jokeText = await jokes.getJoke(decision.fetchJoke);
      titoSpeak(jokeText, "happy");
    }

    // 4. Ejecutar comandos de música si el cerebro lo pidió
    if (decision.musicCommand) {
      if (decision.musicCommand.type === "play") {
        music.play(decision.musicCommand.track);
      } else if (decision.musicCommand.type === "stop") {
        music.stop();
      } else if (decision.musicCommand.type === "next") {
        music.next();
       } else if (decision.musicCommand.type === "volume") music.changeVolume(decision.musicCommand.delta);
      }
    
      //noticias
    if (decision.fetchNews) {
      const report = await news.getTopNews(decision.fetchNews, 4);
      titoSpeak(report, "neutral");
    }

      //clima
    if (decision.fetchWeather) {
      const forecast = await weather.getForecast(decision.fetchWeather);
      titoSpeak(forecast, "happy");
    }

    if (decision.timer) {
      setTimeout(() => {
        titoSpeak(`¡Atención! Ya pasó el tiempo de ${decision.timer.label}.`, "surprised");
      }, decision.timer.ms);
    }
  },
  (isListening) => {
    micStatus.textContent = isListening ? "🟢 Escuchando ('Tito...')" : "🔴 Micrófono en pausa";
  }
);

document.getElementById('btnStartEar').addEventListener('click', (e) => {
  ear.start();
  e.target.style.display = 'none';
  titoSpeak("Sistemas listos. Di mi nombre cuando me necesites.", "happy");
});

document.querySelectorAll('button[data-emotion]').forEach(btn => {
  btn.addEventListener('click', () => face.setEmotion(btn.dataset.emotion));
});

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

let lastTime = 0;
function loop(timestamp) {
  const deltaTime = timestamp - lastTime;
  lastTime = timestamp;
  face.setBeat(music.getBeatEnergy());
  face.update(deltaTime);
  face.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
