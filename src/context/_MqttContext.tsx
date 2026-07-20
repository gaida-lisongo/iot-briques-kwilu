// context/MqttContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { MqttClient } from 'mqtt';
import { SensorPayload } from '@/types/mqtt';
import { createMqttConnection, disconnectMqttClient } from '@/lib/utils/mqtt';

interface MqttContextType {
  data: SensorPayload | null;        // La dernière mesure reçue en direct
  history: SensorPayload[];          // Le tableau de toutes les mesures (anciennes + nouvelles)
  isConnected: boolean;               // État de la connexion MQTT WebSocket
  isLoadingHistory: boolean;          // État de chargement initial des données Redis
  refreshHistory: () => Promise<void>;// Permet de recharger l'historique manuellement
}

const MqttContext = createContext<MqttContextType>({
  data: null,
  history: [],
  isConnected: false,
  isLoadingHistory: true,
  refreshHistory: async () => {},
});

export const MqttProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<SensorPayload | null>(null);
  const [history, setHistory] = useState<SensorPayload[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 1. Fonction pour charger les anciennes données depuis /api/redis (GET)
  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/redis');
      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        setHistory(result.data);
        if (result.data.length > 0) {
          setData(result.data[0]); // Définit la plus récente comme donnée actuelle
        }
      }
    } catch (error) {
      console.error('[MqttProvider] Erreur lors du chargement de l\'historique :', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // 2. Fonction pour sauvegarder la nouvelle donnée via /api/redis (POST)
  const persistMeasure = async (payload: SensorPayload) => {
    try {
      await fetch('/api/redis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[MqttProvider] Erreur lors de la sauvegarde de la mesure :', error);
    }
  };

  // Chargement initial au montage du composant
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Initialisation du socket MQTT
  useEffect(() => {
    const config = {
      url: process.env.NEXT_PUBLIC_MQTT_URL || '',
      username: process.env.NEXT_PUBLIC_MQTT_USER,
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      topic: 'esp32/dht22/data',
    };

    const client: MqttClient = createMqttConnection(
      config,
      async (newPayload) => {
        console.log("Data From ESP32 :", newPayload)
        const enriched = {
          ...newPayload,
          timestamp: new Date().toISOString(),
        };

        // Met à jour la dernière donnée reçue
        setData(enriched);

        // Ajoute en tête du tableau local
        setHistory((prev) => [enriched, ...prev.slice(0, 49)]);

        // Persiste sur Vercel/Redis
        await persistMeasure(newPayload);
      },
      (status) => setIsConnected(status)
    );

    return () => {
      disconnectMqttClient(client);
    };
  }, []);

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

// Hook personnalisé pour consommer le contexte dans les composants clients
export const useMqtt = () => useContext(MqttContext);