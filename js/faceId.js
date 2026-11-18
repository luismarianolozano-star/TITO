export class RobotFaceID {
  constructor(videoElement, onPersonRecognized) {
    this.video = videoElement;
    this.onPersonRecognized = onPersonRecognized;
    this.modelsLoaded = false;
    this.currentPerson = null;
    this.lastGreeted = {}; // Para no saludar cada 2 segundos a la misma persona

    // Cargar rostros guardados previamente en el navegador
    this.knownFaces = this.loadFacesFromStorage();
    this.faceMatcher = null;
    this.updateMatcher();
  }

     loadLibraryScript() {
    return new Promise((resolve, reject) => {
      if (typeof faceapi !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement("script");
      const host = ["unpkg", "com"].join(".");
      const parts = ["face-api.js@0.22.2", "dist", "face-api.min.js"];
      script.src = "https://" + host + "/" + parts.join("/");
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar el script desde unpkg"));
      document.head.appendChild(script);
    });
  }

  async loadModels() {
    if (this.modelsLoaded) return;

    try {
      console.log("⏳ 1/2 Cargando librería de visión...");
      await this.loadLibraryScript();

      const host = ["justadudewhohacks", "github", "io"].join(".");
      const parts = ["face-api.js", "models"];
      const modelUrl = "https://" + host + "/" + parts.join("/");
      
      console.log("⏳ 2/2 Descargando redes neuronales desde:", modelUrl);
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
      ]);

      this.modelsLoaded = true;
      console.log("✅ Modelos faciales listos.");
      this.startRecognitionLoop();
    } catch (e) {
      console.error("❌ Error en sistema de visión:", e);
    }
  }



  // Guarda la huella matemática de la cara actual asociada a un nombre
  async learnFace(name) {
    if (!this.video || this.video.readyState < 2) {
      return { ok: false, msg: "La cámara parece estar apagada. Presiona el botón Activar Cámara." };
    }

    if (!this.modelsLoaded) {
      await this.loadModels();
      if (!this.modelsLoaded) {
        return { ok: false, msg: "Todavía estoy cargando mi sistema de visión. Espera un par de segundos e inténtalo de nuevo." };
      }
    }

    const detection = await faceapi
      .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return { ok: false, msg: "No logro ver tu cara con claridad. Acércate un poco a la cámara e inténtalo de nuevo." };
    }

    const cleanName = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    
    // Guardar descriptor (convertido a Array normal para poder guardarlo en localStorage)
    const existing = this.knownFaces.find(f => f.label === cleanName);
    if (existing) {
      existing.descriptors.push(Array.from(detection.descriptor));
    } else {
      this.knownFaces.push({
        label: cleanName,
        descriptors: [Array.from(detection.descriptor)]
      });
    }

    this.saveFacesToStorage();
    this.updateMatcher();
    this.currentPerson = cleanName;
    this.lastGreeted[cleanName] = Date.now();

    return { ok: true, msg: `¡Listo, ${cleanName}! Ya memoricé tu rostro. A partir de ahora te reconoceré cuando te vea.` };
  }

  updateMatcher() {
    if (this.knownFaces.length === 0 || typeof faceapi === 'undefined') {
      this.faceMatcher = null;
      return;
    }

    const labeledDescriptors = this.knownFaces.map(f => {
      const float32Descriptors = f.descriptors.map(d => new Float32Array(d));
      return new faceapi.LabeledFaceDescriptors(f.label, float32Descriptors);
    });

    // Umbral de distancia 0.55 (cuanto menor, más estricto es el parecido)
    this.faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55);
  }

  saveFacesToStorage() {
    localStorage.setItem('tito_known_faces', JSON.stringify(this.knownFaces));
  }

  loadFacesFromStorage() {
    try {
      const raw = localStorage.getItem('tito_known_faces');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Revisa cada 1.5 segundos quién está delante de la cámara
  startRecognitionLoop() {
    setInterval(async () => {
      if (!this.modelsLoaded || !this.faceMatcher || !this.video || this.video.readyState < 2) return;

      const detection = await faceapi
        .detectSingleFace(this.video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (detection) {
        const bestMatch = this.faceMatcher.findBestMatch(detection.descriptor);
        if (bestMatch.label !== "unknown") {
          const personName = bestMatch.label;
          this.currentPerson = personName;

          // Si hace más de 5 minutos que no veía a esta persona, saludarla espontáneamente
          const now = Date.now();
          if (!this.lastGreeted[personName] || (now - this.lastGreeted[personName] > 300000)) {
            this.lastGreeted[personName] = now;
            if (this.onPersonRecognized) {
              this.onPersonRecognized(personName);
            }
          }
        } else {
          this.currentPerson = null;
        }
      }
    }, 1500);
  }
}
