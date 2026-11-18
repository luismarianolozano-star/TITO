export class RobotHardware {
  constructor(espIp, onStatusChange) {
    this.url = `ws://${espIp}:81/`;
    this.onStatusChange = onStatusChange;
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.isConnected = true;
        if (this.onStatusChange) this.onStatusChange(true);
        console.log("✅ Conectado al ESP32 por WebSocket");
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        if (this.onStatusChange) this.onStatusChange(false);
        console.warn("⚠️ Desconectado del ESP32. Reintentando en 3s...");
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = (err) => {
        console.error("Error de WebSocket:", err);
      };
    } catch (e) {
      console.error("No se pudo iniciar WebSocket:", e);
    }
  }

  sendCommand(cmd) {
    if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(cmd);
      console.log("📤 Enviado al ESP32:", cmd);
      return true;
    } else {
      console.warn("❌ No hay conexión con el ESP32 para enviar:", cmd);
      return false;
    }
  }
}
