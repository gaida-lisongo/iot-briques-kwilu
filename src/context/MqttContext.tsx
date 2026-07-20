// context/MqttContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { MqttClient } from "mqtt";
import { SensorPayload } from "@/types/mqtt";
import {
  createMqttConnection,
  disconnectMqttClient,
} from "@/lib/utils/mqtt";

interface MqttContextType {
  data: SensorPayload | null;
  history: SensorPayload[];
  isConnected: boolean;
  isLoadingHistory: boolean;
  refreshHistory: () => Promise<void>;
}

interface RedisHistoryResponse {
  success: boolean;
  data?: SensorPayload[];
  error?: string;
}

const MqttContext = createContext<MqttContextType>({
  data: null,
  history: [],
  isConnected: false,
  isLoadingHistory: true,
  refreshHistory: async () => undefined,
});

export const MqttProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [history, setHistory] = useState<SensorPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  /**
   * SOURCE UNIQUE DE LECTURE
   *
   * Tous les composants lisent history.
   * history est remplacé uniquement par la réponse GET /api/redis.
   */
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);

    try {
      const response = await fetch("/api/redis", {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const result = (await response.json()) as RedisHistoryResponse;

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        throw new Error(
          result.error ?? "Réponse invalide de l’endpoint Redis."
        );
      }

      setHistory(result.data);
      setData(result.data[0] ?? null);
    } catch (error) {
      console.error(
        "[MqttProvider] Erreur de lecture GET /api/redis :",
        error
      );
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  /**
   * Écriture d'une nouvelle mesure.
   * Après le POST, on recharge immédiatement GET /api/redis.
   * Ainsi, le state React ne devient jamais une seconde source de vérité.
   */
  const persistMeasure = useCallback(
    async (payload: SensorPayload) => {
      const response = await fetch("/api/redis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Impossible de sauvegarder la mesure dans Redis."
        );
      }

      await fetchHistory();
    },
    [fetchHistory]
  );

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    const config = {
      url: process.env.NEXT_PUBLIC_MQTT_URL || "",
      username: process.env.NEXT_PUBLIC_MQTT_USER,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      topic: "esp32/dht22/data",
    };

    if (!config.url) {
      console.warn(
        "[MqttProvider] NEXT_PUBLIC_MQTT_URL est absent : connexion MQTT ignorée."
      );
      return;
    }

    const client: MqttClient = createMqttConnection(
      config,
      async (newPayload) => {
        try {
          await persistMeasure(newPayload);
        } catch (error) {
          console.error(
            "[MqttProvider] Erreur de persistance MQTT -> Redis :",
            error
          );
        }
      },
      setIsConnected
    );

    return () => {
      disconnectMqttClient(client);
    };
  }, [persistMeasure]);

  return (
    <MqttContext.Provider
      value={{
        data,
        history,
        isConnected,
        isLoadingHistory,
        refreshHistory: fetchHistory,
      }}
    >
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);
