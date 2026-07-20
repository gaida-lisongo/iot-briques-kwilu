// lib/utils/mqtt.ts
import mqtt, { MqttClient } from 'mqtt';
import { SensorPayload, MqttConfig, MessageCallback } from '@/types/mqtt';

/**
 * Parse en toute sécurité une trame binaire/string MQTT en objet typé JSON
 */
export function parseMqttPayload(message: Buffer | string): SensorPayload | null {
  try {
    const rawString = typeof message === 'string' ? message : message.toString();
    const parsed = JSON.parse(rawString);

    // Validation basique de la structure attendue
    if (typeof parsed.temperature === 'number' && typeof parsed.humidity === 'number') {
      return parsed as SensorPayload;
    }
    
    console.warn('[MQTT Utility] Format JSON inattendu :', parsed);
    return null;
  } catch (error) {
    console.error('[MQTT Utility] Erreur lors du parsing JSON :', error);
    return null;
  }
}

/**
 * Initialise la connexion WebSocket au Broker MQTT et s'abonne au topic spécifié
 */
export function createMqttConnection(
  config: MqttConfig,
  onMessageReceived: MessageCallback,
  onStatusChange?: (connected: boolean) => void
): MqttClient {
  const { url, username, password, topic } = config;

  const client = mqtt.connect(url, {
    username,
    password,
    clean: true,
    reconnectPeriod: 2000,
  });

  client.on('connect', () => {
    console.log('[MQTT Utility] Connecté au Broker WebSocket');
    if (onStatusChange) onStatusChange(true);

    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`[MQTT Utility] Abonné au topic : ${topic}`);
      } else {
        console.error(`[MQTT Utility] Échec de l'abonnement :`, err);
      }
    });
  });

  client.on('message', (receivedTopic, message) => {
    if (receivedTopic === topic) {
      const parsedData = parseMqttPayload(message);
      if (parsedData) {
        onMessageReceived(parsedData);
      }
    }
  });

  client.on('close', () => {
    if (onStatusChange) onStatusChange(false);
  });

  client.on('error', (error) => {
    console.error('[MQTT Utility] Erreur client :', error);
  });

  return client;
}

/**
 * Ferme proprement la connexion au Broker MQTT
 */
export function disconnectMqttClient(client: MqttClient | null): void {
  if (client) {
    console.log('[MQTT Utility] Déconnexion du client MQTT...');
    client.end(true); // Argument true pour forcer une fermeture immédiate
  }
}