#include <WiFi.h>
#include <WebSocketsServer.h>

const char* ssid = "TU_NOMBRE_WIFI";
const char* password = "TU_PASSWORD_WIFI";

// Pin del LED integrado del ESP32 (suele ser GPIO 2) o conecta un relé aquí
const int PIN_LUZ = 2; 

WebSocketsServer webSocket = WebSocketsServer(81);

void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String mensaje = String((char*)payload);
    Serial.println("Comando recibido: " + mensaje);

    if (mensaje == "LED_ON") {
      digitalWrite(PIN_LUZ, HIGH);
    } 
    else if (mensaje == "LED_OFF") {
      digitalWrite(PIN_LUZ, LOW);
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LUZ, OUTPUT);
  digitalWrite(PIN_LUZ, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConectado!");
  Serial.print("IP del ESP32 (pon esta IP en main.js): ");
  Serial.println(WiFi.localIP());

  webSocket.begin();
  webSocket.onEvent(onWebSocketEvent);
}

void loop() {
  webSocket.loop();
}
