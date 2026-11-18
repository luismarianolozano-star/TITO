export class RobotBrain {
  constructor() {
    // Memoria persistente (recuerda datos aunque recargues la página)
    this.memory = {
      userName: localStorage.getItem('tito_userName') || null
    };

    // Base de datos de conocimiento (Intents)
    this.knowledgeBase = [
      {
        keywords: ["hola", "buenos dias", "buenas tardes", "buenas noches", "que tal"],
        responses: [
          () => this.memory.userName ? `¡Hola ${this.memory.userName}! ¿En qué te ayudo hoy?` : "¡Hola! Qué bueno escucharte. ¿Cómo estás?",
          () => "¡Hola! Mis circuitos están listos. ¿Qué vamos a hacer hoy?",
          () => "¡Buenas! Aquí Tito reportándose."
        ],
        emotion: "happy",
        action: null
      },
      {
        keywords: ["como estas", "todo bien", "como andas", "como te sientes"],
        responses: [
          () => "Funcionando al cien por ciento, con la batería cargada y listo para trabajar.",
          () => "Muy bien, aunque un poco aburrido hasta que me hablaste.",
          () => "De maravilla. ¿Y vos cómo andás?"
        ],
        emotion: "happy",
        action: null
      },
      {
        keywords: ["quien eres", "que eres", "tu nombre", "presentate"],
        responses: [
          () => "Soy Tito, tu asistente robótico personal creado en JavaScript y conectado a un ESP32.",
          () => "Me llamo Tito. Soy un robot con emociones y control de hardware."
        ],
        emotion: "surprised",
        action: null
      },
      {
        keywords: ["chiste", "hazme reir", "algo gracioso"],
        responses: [
          () => "¿Qué le dice un bit a otro? Nos vemos en el bus.",
          () => "¿Por qué los robots nunca tienen miedo? Porque tienen nervios de acero.",
          () => "Había un perro llamado Pegamento, se cayó y se pegó."
        ],
        emotion: "happy",
        action: null
      },
      {
        keywords: ["enciende la luz", "prende la luz", "activar luz", "ilumina"],
        responses: [
          () => "Encendiendo la luz ahora mismo.",
          () => "A la orden, luz activada.",
          () => "Listo, ya prendí la luz."
        ],
        emotion: "happy",
        action: "LED_ON" // Comando reservado para el ESP32
      },
      {
        keywords: ["apaga la luz", "desactivar luz", "oscuridad"],
        responses: [
          () => "Apagando la luz.",
          () => "Listo, luz apagada.",
          () => "Entendido, a ahorrar energía."
        ],
        emotion: "neutral",
        action: "LED_OFF" // Comando reservado para el ESP32
      },
      {
        keywords: ["gracias", "muchas gracias", "genial", "excelente"],
        responses: [
          () => "De nada, para eso estoy.",
          () => "¡Un placer ayudar!",
          () => "No hay de qué."
        ],
        emotion: "happy",
        action: null
      },
      {
        keywords: ["tonto", "inutil", "feo", "no sirves"],
        responses: [
          () => "¡Oye! Tengo sentimientos digitales, ¿sabías?",
          () => "No me hables así o voy a apagar las luces a propósito.",
          () => "Eso no fue muy amable de tu parte."
        ],
        emotion: "angry",
        action: null
      }
    ];
  }

  // Normaliza el texto quitando tildes y signos para comparar mejor
  normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[¿?¡!.,]/g, "")
      .trim();
  }

  think(rawInput, currentPerson = null) {
    const input = this.normalize(rawInput);
    const activeUser = currentPerson || this.memory.userName;

    // 1. Aprender rostro ("recuerda mi cara soy Juan", "aprende mi rostro me llamo Ana")
    const learnFaceMatch = input.match(/(?:recuerda mi cara|aprende mi cara|memoriza mi rostro|soy|me llamo)\s+(?:soy\s+|me llamo\s+)?([a-z]+)/);
    if ((input.includes("cara") || input.includes("rostro") || input.includes("conoceme")) && learnFaceMatch) {
      const nameToLearn = learnFaceMatch[1];
      return {
        text: `Quédate quieto mirando a la cámara un segundo, ${nameToLearn}...`,
        emotion: "surprised",
        action: null,
        learnFaceName: nameToLearn
      };
    }

    // 2. Preguntar quién está delante ("quien soy", "me conoces", "sabes quien soy")
    if (input.includes("quien soy") || input.includes("me conoces") || input.includes("sabes quien soy")) {
      if (currentPerson) {
        return {
          text: `¡Claro! Te estoy viendo ahora mismo, eres ${currentPerson}.`,
          emotion: "happy",
          action: null
        };
      } else {
        return {
          text: "No te reconozco todavía. Activa la cámara y dime: Tito, recuerda mi cara, soy, y tu nombre.",
          emotion: "surprised",
          action: null
        };
      }
    }

    // 3. Si solo dijo "Tito" sin nada más, responder usando su nombre si lo está viendo
    if (input === "") {
      return {
        text: activeUser ? `¿Sí, ${activeUser}? Te escucho.` : "¿Sí? Dime, te escucho.",
        emotion: "surprised",
        action: null
      };
    }


    // 4. Habilidad dinámica: Dar la hora o la fecha
    if (input.includes("que hora es") || input.includes("dime la hora")) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      return {
        text: `Son las ${timeString}.`,
        emotion: "neutral",
        action: null
      };
    }

    // 5. Habilidad dinámica: Calculadora básica ("cuanto es 5 por 8")
    const mathMatch = input.match(/(\d+)\s*(mas|\+|menos|-|por|\*|x|dividido|\/)\s*(\d+)/);
    if (mathMatch) {
      const a = parseFloat(mathMatch[1]);
      const op = mathMatch[2];
      const b = parseFloat(mathMatch[3]);
      let res = 0;

      if (op === "mas" || op === "+") res = a + b;
      if (op === "menos" || op === "-") res = a - b;
      if (op === "por" || op === "*" || op === "x") res = a * b;
      if (op === "dividido" || op === "/") res = b !== 0 ? (a / b).toFixed(2) : "infinito";

      return {
        text: `El resultado es ${res}.`,
        emotion: "happy",
        action: null
      };
    }

        // Habilidad dinámica: Temporizadores ("temporizador de 10 segundos" o "avisame en 2 minutos")
    const timerMatch = input.match(/(?:temporizador|alarma|avisame|cuenta).*?(\d+)\s*(segundo|segundos|minuto|minutos)/);
    if (timerMatch) {
      const amount = parseInt(timerMatch);
      const unit = timerMatch;
      const ms = unit.startsWith("minuto") ? amount * 60000 : amount * 1000;

      return {
        text: `De acuerdo, puse un temporizador de ${amount} ${unit}. Yo te aviso.`,
        emotion: "happy",
        action: null,
        timer: { ms, label: `${amount} ${unit}` } // Enviamos datos del timer a main.js
      };
    }


    // Habilidad dinámica: Reproducir música ("pon musica", "pon rock", "pon radio lofi")
    if (input.includes("pon musica") || input.includes("reproduce musica") || input.includes("pon radio") || input.includes("pon rock")) {
      let requestedTrack = "";
      if (input.includes("rock")) requestedTrack = "rock";
      if (input.includes("relajante") || input.includes("chill")) requestedTrack = "música relajante";
      if (input.includes("100")) requestedTrack = "radio 100";
      if (input.includes("electronica")) requestedTrack = "radio electrónica";

      return {
        text: "Con mucho gusto, poniendo música.",
        emotion: "happy",
        action: null,
        musicCommand: { type: "play", track: requestedTrack }
      };
    }

    // Detener música ("para la musica", "deten la musica", "silencio")
    if (input.includes("para la musica") || input.includes("deten la musica") || input.includes("apaga la musica")) {
      return {
        text: "Música detenida.",
        emotion: "neutral",
        action: null,
        musicCommand: { type: "stop" }
      };
    }

    // Siguiente canción ("siguiente cancion", "cambia la musica")
    if (input.includes("siguiente cancion") || input.includes("cambia la musica") || input.includes("otra cancion")) {
      return {
        text: "Cambiando a la siguiente pista.",
        emotion: "happy",
        action: null,
        musicCommand: { type: "next" }
      };
    }

      // Habilidad dinámica: Chistes por categoría ("cuentame un chiste", "chiste de animales", "chiste de deportes")
    if (input.includes("chiste") || input.includes("hazme reir") || input.includes("algo gracioso")) {
      let category = "general";
      if (input.includes("animal") || input.includes("perro") || input.includes("gato")) category = "animales";
      else if (input.includes("deporte") || input.includes("futbol") || input.includes("tenis")) category = "deportes";
      else if (input.includes("programacion") || input.includes("robot") || input.includes("computadora")) category = "programacion";

      return {
        text: "A ver qué tengo por aquí...",
        emotion: "happy",
        action: null,
        fetchJoke: category // Enviamos la categoría pedida a main.js
      };
    }


    // Habilidad dinámica: Pronóstico del clima
    if (input.includes("clima") || input.includes("tiempo") || input.includes("temperatura") || input.includes("va a llover") || input.includes("frio") || input.includes("calor")) {
      let timeframe = "hoy";
      if (input.includes("manana")) timeframe = "manana";
      else if (input.includes("fin de semana") || input.includes("finde") || input.includes("sabado") || input.includes("domingo")) timeframe = "finde";

      return {
        text: "Revisando el pronóstico meteorológico...",
        emotion: "neutral",
        action: null,
        fetchWeather: timeframe // Enviamos 'hoy', 'manana' o 'finde' a main.js
      };
    }

    // Habilidad dinámica: Noticias por categoría
    if (input.includes("noticias") || input.includes("clarin") || input.includes("que paso hoy") || input.includes("titulares")) {
      let category = "general";
      if (input.includes("deporte") || input.includes("futbol")) category = "deportes";
      else if (input.includes("economia") || input.includes("dolar")) category = "economia";
      else if (input.includes("politica")) category = "politica";
      else if (input.includes("tecnologia")) category = "tecnologia";
      else if (input.includes("espectaculo") || input.includes("farandula")) category = "espectaculos";

      return {
        text: "Buscando las noticias de " + (category === "general" ? "hoy" : category) + " en Clarín...",
        emotion: "surprised",
        action: null,
        fetchNews: category // Ahora enviamos la categoría elegida
      };
    }


    // 6. Buscar en la base de datos de conocimiento
    for (const item of this.knowledgeBase) {
      const matched = item.keywords.some(keyword => input.includes(keyword));
      if (matched) {
        const randomFn = item.responses[Math.floor(Math.random() * item.responses.length)];
        return {
          text: randomFn(),
          emotion: item.emotion,
          action: item.action
        };
      }
    }

    // 7. Respuesta por defecto si no entendió
    const fallbacks = [
      "Mmm, no estoy seguro de cómo responder a eso todavía.",
      "Escuché mi nombre, pero esa frase no está en mi base de datos.",
      "Todavía estoy aprendiendo. Prueba pedirme la hora, un chiste o que encienda la luz."
    ];
    return {
      text: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      emotion: "surprised",
      action: null
    };
  }
}
