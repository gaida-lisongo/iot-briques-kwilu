"use client";

import React from "react";
import Badge from "../ui/badge/Badge";
import { ArrowDownIcon, ArrowUpIcon } from "@/icons";
import { useMqtt } from "@/context/MqttContext";

export const SensorMetrics = () => {
  const { data, isConnected } = useMqtt();

  // Récupération des seuils critiques depuis les variables d'environnement
  const maxTemp = Number(process.env.NEXT_PUBLIC_TEMP) || 50; // Valeur par défaut si non définie
  const maxHum = Number(process.env.NEXT_PUBLIC_HUM) || 100;

  // Extraction des valeurs actuelles (ou 0 par défaut)
  const currentTemp = data?.temperature ?? 0;
  const currentHum = data?.humidity ?? 0;

  // Calcul du pourcentage par rapport aux seuils critiques
  const tempRatio = Math.min(Math.round((currentTemp / maxTemp) * 100), 100);
  const humRatio = Math.min(Math.round((currentHum / maxHum) * 100), 100);

  // Détermination de l'état critique (Alerte si > 80% du seuil critique)
  const isTempCritical = tempRatio >= 80;
  const isHumCritical = humRatio >= 80;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item : Température --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gray-100 rounded-xl dark:bg-gray-800">
            🌡️
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isConnected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
              }`}
            />
            {isConnected ? "En direct" : "Hors ligne"}
          </span>
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Température
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data ? `${currentTemp.toFixed(1)} °C` : "-- °C"}
            </h4>
          </div>

          <Badge color={isTempCritical ? "error" : "success"}>
            {isTempCritical ? (
              <ArrowUpIcon className="text-error-500" />
            ) : (
              <ArrowDownIcon />
            )}
            {tempRatio}% du max ({maxTemp}°C)
          </Badge>
        </div>
      </div>

      {/* <!-- Metric Item : Humidité --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-center w-12 h-12 text-2xl bg-gray-100 rounded-xl dark:bg-gray-800">
            💧
          </div>
          <span className="text-xs text-gray-400">
            Seuil : {maxHum}%
          </span>
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Humidité
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {data ? `${currentHum.toFixed(1)} %` : "-- %"}
            </h4>
          </div>

          <Badge color={isHumCritical ? "error" : "success"}>
            {isHumCritical ? (
              <ArrowUpIcon className="text-error-500" />
            ) : (
              <ArrowDownIcon />
            )}
            {humRatio}% du max
          </Badge>
        </div>
      </div>
    </div>
  );
};