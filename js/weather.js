export class RobotWeather {
  constructor() {
    // Coordenadas de Lomas de Zamora, Buenos Aires (puedes cambiarlas si te mudas)
    this.lat = "-34.76";
    this.lon = "-58.40";
    this.cityName = "Lomas de Zamora";
    this.host = ["api", "open-meteo", "com"].join(".");
  }

  // Traduce códigos meteorológicos de Open-Meteo a español natural
  describeWeatherCode(code) {
    if (code === 0) return "cielo despejado";
    if (code >= 1 && code <= 3) return "parcialmente nublado";
    if (code === 45 || code === 48) return "niebla";
    if (code >= 51 && code <= 67) return "lloviznas o lluvias";
    if (code >= 71 && code <= 77) return "nieve";
    if (code >= 80 && code <= 82) return "chaparrones";
    if (code >= 95) return "tormentas eléctricas";
    return "condiciones variables";
  }

  async getForecast(timeframe = "hoy") {
    try {
      const url = new URL("https://" + this.host + "/v1/forecast");
      url.searchParams.set("latitude", this.lat);
      url.searchParams.set("longitude", this.lon);
      url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
      url.searchParams.set("timezone", "America/Argentina/Buenos_Aires");

      const response = await fetch(url.href);
      if (!response.ok) throw new Error("Error consultando el clima");

      const data = await response.json();

      // 1. CLIMA DE HOY / ACTUAL (índice 0 en daily)
      if (timeframe === "hoy") {
        const tempActual = Math.round(data.current.temperature_2m);
        const estadoActual = this.describeWeatherCode(data.current.weather_code);
        const maxHoy = Math.round(data.daily.temperature_2m_max);
        const minHoy = Math.round(data.daily.temperature_2m_min);
        const lluviaHoy = data.daily.precipitation_probability_max;

        return `En ${this.cityName} actualmente hacen ${tempActual} grados con ${estadoActual}. Para hoy se espera una mínima de ${minHoy} y una máxima de ${maxHoy} grados, con ${lluviaHoy} por ciento de probabilidad de lluvia.`;
      }

      // 2. CLIMA DE MAÑANA (índice 1 en daily)
      if (timeframe === "manana") {
        const estadoManana = this.describeWeatherCode(data.daily.weather_code);
        const maxManana = Math.round(data.daily.temperature_2m_max);
        const minManana = Math.round(data.daily.temperature_2m_min);
        const lluviaManana = data.daily.precipitation_probability_max;

        return `Para mañana en ${this.cityName} se espera ${estadoManana}, con una mínima de ${minManana} grados, una máxima de ${maxManana}, y ${lluviaManana} por ciento de probabilidad de precipitaciones.`;
      }

      // 3. CLIMA DEL FIN DE SEMANA (busca el próximo sábado y domingo en los 7 días)
      if (timeframe === "finde") {
        let satIndex = -1;
        let sunIndex = -1;

        data.daily.time.forEach((dateStr, idx) => {
          // Crear fecha al mediodía para evitar desfases de zona horaria
          const dayOfWeek = new Date(dateStr + "T12:00:00").getDay();
          if (dayOfWeek === 6 && satIndex === -1) satIndex = idx; // 6 = Sábado
          if (dayOfWeek === 0 && sunIndex === -1 && idx > 0) sunIndex = idx; // 0 = Domingo
        });

        let report = `Pronóstico para el fin de semana en ${this.cityName}: `;
        if (satIndex !== -1) {
          const descSat = this.describeWeatherCode(data.daily.weather_code[satIndex]);
          const minSat = Math.round(data.daily.temperature_2m_min[satIndex]);
          const maxSat = Math.round(data.daily.temperature_2m_max[satIndex]);
          report += `El sábado estará con ${descSat}, mínima de ${minSat} y máxima de ${maxSat} grados. `;
        }
        if (sunIndex !== -1) {
          const descSun = this.describeWeatherCode(data.daily.weather_code[sunIndex]);
          const minSun = Math.round(data.daily.temperature_2m_min[sunIndex]);
          const maxSun = Math.round(data.daily.temperature_2m_max[sunIndex]);
          report += `El domingo se espera ${descSun}, con temperaturas entre ${minSun} y ${maxSun} grados.`;
        }
        return report;
      }

    } catch (error) {
      console.error("Error al obtener clima:", error);
      return "Lo siento, en este momento no pude conectarme con el servicio meteorológico.";
    }
  }
}
