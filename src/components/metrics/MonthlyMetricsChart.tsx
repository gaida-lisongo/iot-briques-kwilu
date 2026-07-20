"use client";

import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type MetricFilter = "ALL" | "TEMP" | "HUM";

interface MonthlyData {
  month: string;
  temperature: number | null;
  humidity: number | null;
}

export default function MonthlyMetricsChart() {
  const [filter, setFilter] = useState<MetricFilter>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Données mensuelles initialisées à vide
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  // Récupération des données moyennes depuis l'API Redis
  useEffect(() => {
    async function fetchRedisMetrics() {
      try {
        setLoading(true);
        const res = await fetch("/api/metrics/monthly");
        if (res.ok) {
          const data = await res.json();
          setMonthlyData(data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération depuis Redis:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRedisMetrics();
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleSelectFilter = (selected: MetricFilter) => {
    setFilter(selected);
    closeDropdown();
  };

  // Séries temporelles dynamiques selon le filtre
  const tempSeries = {
    name: "Température (°C)",
    data: monthlyData.map((d) => d.temperature ?? 0),
    color: "#ff4560", // Rouge/Orange
  };

  const humSeries = {
    name: "Humidité (%)",
    data: monthlyData.map((d) => d.humidity ?? 0),
    color: "#008ffb", // Bleu
  };

  const series = [];
  if (filter === "ALL" || filter === "TEMP") series.push(tempSeries);
  if (filter === "ALL" || filter === "HUM") series.push(humSeries);

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "area",
      height: 250,
      toolbar: { show: false },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
      ],
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
              title: { text: "Température (°C)" },
              labels: { formatter: (val) => `${val.toFixed(1)} °C` },
            },
            {
              opposite: true,
              title: { text: "Humidité (%)" },
              labels: { formatter: (val) => `${val.toFixed(0)} %` },
            },
          ]
        : [
            {
              labels: {
                formatter: (val) =>
                  filter === "TEMP" ? `${val.toFixed(1)} °C` : `${val.toFixed(0)} %`,
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
      y: {
        formatter: (val: number) => `${val.toFixed(1)}`,
      },
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Moyennes Mensuelles ({new Date().getFullYear()})
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Affichage : {filter === "ALL" ? "Tous" : filter === "TEMP" ? "Température" : "Humidité"}
          </p>
        </div>

        <div className="relative inline-block">
          <button onClick={toggleDropdown} className="dropdown-toggle p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" />
          </button>
          <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-40 p-2">
            <DropdownItem
              onItemClick={() => handleSelectFilter("ALL")}
              className={`flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 ${
                filter === "ALL" ? "font-semibold text-brand-500 dark:text-white" : ""
              }`}
            >
              Tous
            </DropdownItem>
            <DropdownItem
              onItemClick={() => handleSelectFilter("TEMP")}
              className={`flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 ${
                filter === "TEMP" ? "font-semibold text-brand-500 dark:text-white" : ""
              }`}
            >
              Température
            </DropdownItem>
            <DropdownItem
              onItemClick={() => handleSelectFilter("HUM")}
              className={`flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300 ${
                filter === "HUM" ? "font-semibold text-brand-500 dark:text-white" : ""
              }`}
            >
              Humidité
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar mt-4">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          {loading ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
              Chargement des données Redis...
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