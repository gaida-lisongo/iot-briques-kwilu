// types/mqtt.ts
export interface SensorPayload {
  device_id: string;
  temperature: number;
  humidite: number;
  status: string;
  timestamp?: string;
}

export interface MqttConfig {
  url: string;
  username?: string;
  password?: string;
  topic: string;
}

export type MessageCallback = (data: SensorPayload) => void;