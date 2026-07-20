"use client";

import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useMqtt } from "@/context/MqttContext";
import type { SensorPayload } from "@/types/mqtt";

export interface SensorReading {
  id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  deviceStatus: "Normal" | "Attention" | "Critique";
}

const CalendarIcon = () => (
  <svg
    className="h-4 w-4 text-gray-500 dark:text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
    />
  </svg>
);

const ThermometerIcon = () => (
  <svg
    className="h-5 w-5 text-rose-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 019 5.214M15 11.25a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v10.5" />
  </svg>
);

const DropletIcon = () => (
  <svg
    className="h-5 w-5 text-blue-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2.25c-5.25 6-7.5 9.75-7.5 13.5a7.5 7.5 0 0015 0c0-3.75-2.25-7.5-7.5-13.5z"
    />
  </svg>
);

const RefreshIcon = ({
  className = "h-4 w-4",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

function toLocalDateKey(timestamp: string): string | null {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function computeStatus(
  payload: Pick<SensorPayload, "temperature" | "humidity">,
  maxTemp: number,
  maxHum: number
): SensorReading["deviceStatus"] {
  const tempRatio = payload.temperature / maxTemp;
  const humRatio = payload.humidity / maxHum;

  if (tempRatio >= 0.9 || humRatio >= 0.9) return "Critique";
  if (tempRatio >= 0.75 || humRatio >= 0.75) return "Attention";
  return "Normal";
}

export default function RealtimeSensorTable() {
  const {
    history,
    isLoadingHistory,
    refreshHistory,
    isConnected,
  } = useMqtt();

  const maxTemp = Number(process.env.NEXT_PUBLIC_TEMP) || 50;
  const maxHum = Number(process.env.NEXT_PUBLIC_HUM) || 100;

  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateKey(new Date().toISOString())!
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Source unique :
   * history vient uniquement de GET /api/redis via MqttContext.
   * Aucun endpoint /api/metrics/daily n'est utilisé.
   */
  const readings = useMemo<SensorReading[]>(() => {
    return history
      .filter(
        (item): item is SensorPayload & { timestamp: string } =>
          typeof item.timestamp === "string" &&
          toLocalDateKey(item.timestamp) === selectedDate
      )
      .map((item, index) => {
        const date = new Date(item.timestamp);

        return {
          id: `${item.device_id}-${item.timestamp}-${index}`,
          timestamp: date.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          temperature: item.temperature,
          humidity: item.humidity,
          deviceStatus: computeStatus(item, maxTemp, maxHum),
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [history, selectedDate, maxTemp, maxHum]);

  const dailyStats = useMemo(() => {
    if (readings.length === 0) {
      return { avgTemp: 0, avgHum: 0, total: 0 };
    }

    const totals = readings.reduce(
      (acc, reading) => {
        acc.temperature += reading.temperature;
        acc.humidity += reading.humidity;
        return acc;
      },
      { temperature: 0, humidity: 0 }
    );

    return {
      avgTemp: totals.temperature / readings.length,
      avgHum: totals.humidity / readings.length,
      total: readings.length,
    };
  }, [readings]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshHistory();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/30">
              <ThermometerIcon />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Température moyenne ({selectedDate})
              </p>
              <h4 className="mt-0.5 text-xl font-bold text-gray-800 dark:text-white/90">
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

        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
              <DropletIcon />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Humidité moyenne ({selectedDate})
              </p>
              <h4 className="mt-0.5 text-xl font-bold text-gray-800 dark:text-white/90">
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

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Historique des mesures
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {dailyStats.total} mesure(s) issue(s) de GET /api/redis — MQTT{" "}
              {isConnected ? "connecté" : "déconnecté"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3">
                <CalendarIcon />
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-theme-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              />
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              <RefreshIcon
                className={`h-4 w-4 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
              />
              Actualiser Redis
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Horodatage
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Température (°C)
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Humidité (%)
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Niveau du seuil
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  État
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoadingHistory || isRefreshing ? (
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
                  const tempRatio = Math.round(
                    (reading.temperature / maxTemp) * 100
                  );

                  return (
                    <TableRow key={reading.id}>
                      <TableCell className="py-3 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                        {reading.timestamp}
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                        {reading.temperature.toFixed(1)} °C
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                        {reading.humidity.toFixed(1)} %
                      </TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                        {tempRatio}% du maximum ({maxTemp}°C)
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
