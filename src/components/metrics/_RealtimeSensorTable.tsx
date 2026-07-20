"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useMqtt } from "@/context/MqttContext";

// Interface d'une mesure de capteur
export interface SensorReading {
  id: string;
  timestamp: string; // ISO String ou heure formatée HH:mm:ss
  temperature: number;
  humidity: number;
  deviceStatus: "Normal" | "Attention" | "Critique";
}

// --- Icônes SVG ---
const CalendarIcon = () => (
  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const ThermometerIcon = () => (
  <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 019 5.214M15 11.25a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10.5" />
  </svg>
);

const DropletIcon = () => (
  <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c-5.25 6-7.5 9.75-7.5 13.5a7.5 7.5 0 0015 0c0-3.75-2.25-7.5-7.5-13.5z" />
  </svg>
);

const RefreshIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export default function RealtimeSensorTable() {
  const { data: realtimeData, isConnected } = useMqtt();

  // Seuils critiques depuis .env.local
  const maxTemp = Number(process.env.NEXT_PUBLIC_TEMP) || 50;
  const maxHum = Number(process.env.NEXT_PUBLIC_HUM) || 100;

  // États pour la date recherchée et le stockage des enregistrements
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 1. Charger l'historique Redis pour la date sélectionnée
  const fetchRedisReadings = async (dateStr: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/metrics/daily?date=${dateStr}`);
      if (res.ok) {
        const data: SensorReading[] = await res.json();
        setReadings(data);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des métriques Redis :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedisReadings(selectedDate);
  }, [selectedDate]);

  // 2. Traitement des données entrantes semi-temps réel (MQTT)
  useEffect(() => {
    if (!realtimeData) return;

    const todayStr = new Date().toISOString().split("T")[0];
    // N'ajouter la valeur au tableau direct que si la vue actuelle est celle d'aujourd'hui
    if (selectedDate === todayStr) {
      const tempRatio = realtimeData.temperature / maxTemp;
      const humRatio = realtimeData.humidity / maxHum;

      let status: "Normal" | "Attention" | "Critique" = "Normal";
      if (tempRatio >= 0.9 || humRatio >= 0.9) {
        status = "Critique";
      } else if (tempRatio >= 0.75 || humRatio >= 0.75) {
        status = "Attention";
      }

      const newEntry: SensorReading = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        temperature: realtimeData.temperature,
        humidity: realtimeData.humidity,
        deviceStatus: status,
      };

      setReadings((prev) => [newEntry, ...prev.slice(0, 49)]); // Conserver les 50 dernières entrées
    }
  }, [realtimeData, selectedDate, maxTemp, maxHum]);

  // 3. Calculs des moyennes journalières
  const dailyStats = useMemo(() => {
    if (readings.length === 0) return { avgTemp: 0, avgHum: 0, total: 0 };
    const sumTemp = readings.reduce((acc, curr) => acc + curr.temperature, 0);
    const sumHum = readings.reduce((acc, curr) => acc + curr.humidity, 0);
    return {
      avgTemp: sumTemp / readings.length,
      avgHum: sumHum / readings.length,
      total: readings.length,
    };
  }, [readings]);

  return (
    <div className="space-y-5">
      {/* --- Cartes des moyennes journalières --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        {/* Carte Température Moyenne */}
        <div className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl">
              <ThermometerIcon />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Température Moyenne ({selectedDate})
              </p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-0.5">
                {dailyStats.avgTemp.toFixed(1)} °C
              </h4>
            </div>
          </div>
          <Badge
            color={
              dailyStats.avgTemp >= maxTemp * 0.8
                ? "error"
                : dailyStats.avgTemp >= maxTemp * 0.6
                ? "warning"
                : "success"
            }
          >
            Seuil {maxTemp}°C
          </Badge>
        </div>

        {/* Carte Humidité Moyenne */}
        <div className="flex items-center justify-between p-5 border border-gray-200 rounded-2xl bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
              <DropletIcon />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Humidité Moyenne ({selectedDate})
              </p>
              <h4 className="text-xl font-bold text-gray-800 dark:text-white/90 mt-0.5">
                {dailyStats.avgHum.toFixed(1)} %
              </h4>
            </div>
          </div>
          <Badge
            color={
              dailyStats.avgHum >= maxHum * 0.8
                ? "error"
                : dailyStats.avgHum >= maxHum * 0.6
                ? "warning"
                : "success"
            }
          >
            Seuil {maxHum}%
          </Badge>
        </div>
      </div>

      {/* --- Tableau de données des relevés --- */}
      <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Historique des Mesures
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dailyStats.total} enregistrement(s) trouvé(s) pour la journée
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche par Date */}
            <div className="relative flex items-center">
              <span className="absolute left-3 pointer-events-none">
                <CalendarIcon />
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-theme-sm text-gray-700 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Bouton de rafraîchissement Redis */}
            <button
              onClick={() => fetchRedisReadings(selectedDate)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              <RefreshIcon className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Horodatage
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Température (°C)
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Humidité (%)
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Écart Seuil Temp.
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  État
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Chargement des mesures depuis Redis...
                  </TableCell>
                </TableRow>
              ) : readings.length === 0 ? (
                <TableRow>
                  <TableCell className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Aucune mesure disponible pour cette date.
                  </TableCell>
                </TableRow>
              ) : (
                readings.map((reading) => {
                  const tempRatio = Math.round((reading.temperature / maxTemp) * 100);
                  return (
                    <TableRow key={reading.id}>
                      <TableCell className="py-3 text-gray-800 font-medium text-theme-sm dark:text-white/90">
                        {reading.timestamp}
                      </TableCell>
                      <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                        {reading.temperature.toFixed(1)} °C
                      </TableCell>
                      <TableCell className="py-3 text-gray-600 text-theme-sm dark:text-gray-300">
                        {reading.humidity.toFixed(1)} %
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {tempRatio}% du max ({maxTemp}°C)
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          size="sm"
                          color={
                            reading.deviceStatus === "Normal"
                              ? "success"
                              : reading.deviceStatus === "Attention"
                              ? "warning"
                              : "error"
                          }
                        >
                          {reading.deviceStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}