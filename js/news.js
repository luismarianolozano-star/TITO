export class RobotNews {
  constructor() {
    const clarinHost = ["www", "clarin", "com"].join(".");
    const baseUrl = "https://" + clarinHost + "/rss/";

    // Canales RSS oficiales de Clarín por categoría
    this.feeds = {
      general:    baseUrl + "lo-ultimo/",
      deportes:   baseUrl + "deportes/",
      politica:   baseUrl + "politica/",
      economia:   baseUrl + "economia/",
      tecnologia: baseUrl + "tecnologia/",
      espectaculos: baseUrl + "espectaculos/"
    };
  }

  fetchJsonp(url) {
    return new Promise((resolve, reject) => {
      const callbackName = "tito_news_cb_" + Math.floor(Math.random() * 100000);
      const script = document.createElement("script");

      const timeout = setTimeout(() => {
        delete window[callbackName];
        script.remove();
        reject(new Error("Tiempo de espera agotado"));
      }, 6000);

      window[callbackName] = (data) => {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        resolve(data);
      };

      script.onerror = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
        reject(new Error("Error cargando script de noticias"));
      };

      const separator = url.includes("?") ? "&" : "?";
      script.src = url + separator + "callback=" + callbackName;
      document.body.appendChild(script);
    });
  }

  // Limpia etiquetas HTML (como <p>, <br>, <img>) que a veces vienen en el resumen
  cleanHtml(htmlText) {
    if (!htmlText) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;
    return (tempDiv.textContent || tempDiv.innerText || "").trim();
  }

  async getTopNews(category = "general", limit = 4) {
    const rssUrl = this.feeds[category] || this.feeds.general;

    try {
      const apiHost = ["api", "rss2json", "com"].join(".");
      const apiUrl = new URL("https://" + apiHost + "/v1/api.json");
      apiUrl.searchParams.set("rss_url", rssUrl);

      const data = await this.fetchJsonp(apiUrl.href);

      if (data && data.status === "ok" && data.items && data.items.length > 0) {
        const headlines = data.items.slice(0, limit).map((item, i) => {
          const title = item.title.trim();
          // Extraer el resumen de la noticia para que sea más largo y completo
          const summary = this.cleanHtml(item.description);
          
          if (summary && summary.toLowerCase() !== title.toLowerCase()) {
            return "Noticia " + (i + 1) + ": " + title + ". " + summary;
          }
          return "Noticia " + (i + 1) + ": " + title + ".";
        });

        const intro = category === "general" 
          ? "Estas son las noticias más importantes de hoy en Clarín. " 
          : "Estas son las noticias de " + category + " en Clarín. ";

        return intro + headlines.join(" ");
      }
    } catch (error) {
      console.warn("No se pudo conectar con Clarín:", error);
    }

    return "Lo siento, en este momento no pude obtener las noticias de " + category + ".";
  }
}
