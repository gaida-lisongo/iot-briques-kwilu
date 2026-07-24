"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useMemo, useState } from "react";
import { useMqtt } from "@/context/MqttContext";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type MetricFilter = "ALL" | "TEMP" | "HUM";

interface MonthlyData {
  month: string;
  temperature: number | null;
  humidity: number | null;
  count: number;
}

const MONTH_LABELS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export default function MonthlyMetricsChart() {
  const { history, isLoadingHistory } = useMqtt();
  const [filter, setFilter] = useState<MetricFilter>("ALL");
  const [isOpen, setIsOpen] = useState(false);

  const currentYear = new Date().getFullYear();

  /**
   * Source unique :
   * history est alimenté exclusivement par GET /api/redis dans MqttContext.
   * Aucun endpoint /api/metrics/monthly n'est utilisé.
   */
  const monthlyData = useMemo<MonthlyData[]>(() => {
    const buckets = Array.from({ length: 12 }, (_, monthIndex) => ({
      month: MONTH_LABELS[monthIndex],
      tempSum: 0,
      humSum: 0,
      tempCount: 0,
      humCount: 0,
      count: 0,
    }));

    for (const reading of history) {
      if (!reading.timestamp) continue;

      const date = new Date(reading.timestamp);
      if (Number.isNaN(date.getTime()) || date.getFullYear() !== currentYear) {
        continue;
      }

      const bucket = buckets[date.getMonth()];
      bucket.count += 1;

      if (Number.isFinite(reading.temperature)) {
        bucket.tempSum += reading.temperature;
        bucket.tempCount += 1;
      }

      if (Number.isFinite(reading.humidite)) {
        bucket.humSum += reading.humidite;
        bucket.humCount += 1;
      }
    }

    return buckets.map((bucket) => ({
      month: bucket.month,
      temperature:
        bucket.tempCount > 0 ? bucket.tempSum / bucket.tempCount : null,
      humidity: bucket.humCount > 0 ? bucket.humSum / bucket.humCount : null,
      count: bucket.count,
    }));
  }, [history, currentYear]);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  const handleSelectFilter = (selected: MetricFilter) => {
    setFilter(selected);
    closeDropdown();
  };

  const series = useMemo(() => {
    const result = [];

    if (filter === "ALL" || filter === "TEMP") {
      result.push({
        name: "Température moyenne (°C)",
        data: monthlyData.map((item) => item.temperature),
      });
    }

    if (filter === "ALL" || filter === "HUM") {
      result.push({
        name: "Humidité moyenne (%)",
        data: monthlyData.map((item) => item.humidity),
      });
    }

    return result;
  }, [filter, monthlyData]);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 250,
      toolbar: { show: false },
      animations: { enabled: true },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: monthlyData.map((item) => item.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis:
      filter === "ALL"
        ? [
            {
              seriesName: "Température moyenne (°C)",
              title: { text: "Température (°C)" },
              labels: {
                formatter: (value) => `${value.toFixed(1)} °C`,
              },
            },
            {
              seriesName: "Humidité moyenne (%)",
              opposite: true,
              title: { text: "Humidité (%)" },
              labels: {
                formatter: (value) => `${value.toFixed(0)} %`,
              },
            },
          ]
        : [
            {
              labels: {
                formatter: (value) =>
                  filter === "TEMP"
                    ? `${value.toFixed(1)} °C`
                    : `${value.toFixed(0)} %`,
              },
            },
          ],
    grid: {
      yaxis: { lines: { show: true } },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.05,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value: number, context) => {
          const seriesName =
            context.w.config.series?.[context.seriesIndex]?.name ?? "";

          return seriesName.includes("Température")
            ? `${value.toFixed(1)} °C`
            : `${value.toFixed(1)} %`;
        },
      },
    },
    noData: {
      text: "Aucune donnée Redis disponible",
    },
  };

  const totalReadings = monthlyData.reduce(
    (sum, item) => sum + item.count,
    0
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Moyennes mensuelles ({currentYear})
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {totalReadings} mesure(s) agrégée(s) depuis GET /api/redis
          </p>
        </div>

        <div className="relative inline-block">
          <button
            type="button"
            onClick={toggleDropdown}
            className="dropdown-toggle rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-white/5"
            aria-label="Filtrer les métriques"
          >
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>

          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            {(["ALL", "TEMP", "HUM"] as MetricFilter[]).map((item) => (
              <DropdownItem
                key={item}
                onItemClick={() => handleSelectFilter(item)}
                className={`flex w-full rounded-lg text-left font-normal text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 ${
                  filter === item
                    ? "font-semibold text-brand-500 dark:text-white"
                    : ""
                }`}
              >
                {item === "ALL"
                  ? "Tous"
                  : item === "TEMP"
                  ? "Température"
                  : "Humidité"}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
      </div>

      <div className="custom-scrollbar mt-4 max-w-full overflow-x-auto">
        <div className="-ml-5 min-w-[650px] pl-2 xl:min-w-full">
          {isLoadingHistory ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
              Chargement depuis Redis...
            </div>
          ) : (
            <ReactApexChart
              options={options}
              series={series}
              type="area"
              height={250}
            />
          )}
        </div>
      </div>
    </div>
  );
}
