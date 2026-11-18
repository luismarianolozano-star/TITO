export class RobotJokes {
  constructor() {
    this.host = ["v2", "jokeapi", "dev"].join(".");
    this.lastJoke = "";

    // Colección local ampliada para categorías específicas (animales, deportes) y respaldo offline
    this.localJokes = {
      animales: [
        "¿Qué hace una abeja en el gimnasio? ¡Zum-ba!",
        "¿Cuál es el animal más antiguo? La cebra, porque está en blanco y negro.",
        "¿Qué le dice un pez a otro? ¡Nada!",
        "¿Por qué los pájaros no usan Facebook? Porque ya tienen Twitter.",
        "¿Qué hace una vaca con los ojos cerrados? Leche concentrada.",
        "¿Cómo se llama el campeón de buceo japonés? Tokofondo. ¿Y el subcampeón? Kasitoko.",
        "¿Qué le dice un gusano a otro gusano? Voy a dar una vuelta a la manzana."
      ],
      deportes: [
        "¿Cuál es el colmo de un futbolista? Hacer un gol de media cancha y que el árbitro lo anule por fuera de juego.",
        "¿Por qué el libro de matemáticas estaba triste en el partido? Porque tenía muchos problemas.",
        "¿Qué hace un perro en un partido de tenis? ¡Saca!",
        "En un partido de fútbol entre animales, ¿quién es el mejor delantero? El guepardo, porque nadie lo alcanza.",
        "¿Por qué los futbolistas nunca tienen calor? Porque tienen muchos ventiladores en la tribuna.",
        "¿Qué deporte practican los esqueletos? El salto mortal."
      ],
      general: [
        "¿Qué le dice un bit a otro? Nos vemos en el bus.",
        "¿Por qué los robots nunca tienen miedo? Porque tienen nervios de acero.",
        "¿Cuál es el café más peligroso del mundo? El ex-preso.",
        "¿Qué le dice una impresora a otra? ¿Esa hoja es tuya o es impresión mía?",
        "¿Cómo se despiden los químicos? Ácido un placer."
      ]
    };
  }

  getRandomLocal(category) {
    const list = this.localJokes[category] || this.localJokes.general;
    let selected = list[Math.floor(Math.random() * list.length)];
    
    // Evitar repetir el mismo chiste seguido
    if (list.length > 1 && selected === this.lastJoke) {
      selected = list[(list.indexOf(selected) + 1) % list.length];
    }
    this.lastJoke = selected;
    return selected;
  }

  async getJoke(category = "general") {
    // Si pide animales o deportes, usamos la colección temática dedicada
    if (category === "animales" || category === "deportes") {
      return this.getRandomLocal(category);
    }

    // Para chistes generales o de programación, consultamos JokeAPI en español en tiempo real
    try {
      const apiCategory = category === "programacion" ? "Programming" : "Any";
      const url = new URL("https://" + this.host + "/joke/" + apiCategory);
      url.searchParams.set("lang", "es");
      url.searchParams.set("safe-mode", ""); // Filtra contenido ofensivo

      const response = await fetch(url.href);
      if (!response.ok) throw new Error("Error en API de chistes");

      const data = await response.json();

      if (!data.error) {
        let jokeText = "";
        // JokeAPI devuelve chistes de una sola frase ('single') o de pregunta y remate ('twopart')
        if (data.type === "single") {
          jokeText = data.joke;
        } else if (data.type === "twopart") {
          jokeText = data.setup + " ... " + data.delivery;
        }

        if (jokeText) {
          this.lastJoke = jokeText;
          return jokeText;
        }
      }
    } catch (error) {
      console.warn("Usando chiste local por fallo de red:", error);
    }

    // Respaldo automático si falla internet
    return this.getRandomLocal("general");
  }
}
