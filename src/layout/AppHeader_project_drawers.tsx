"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useSidebar } from "@/context/SidebarContext";
import React, { useEffect, useState } from "react";

type DrawerType = "context" | "students" | null;

const MenuIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6L18 18M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 7H20M4 12H20M4 17H14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );

const ProjectIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M4.75 5.75A1.75 1.75 0 0 1 6.5 4h11A1.75 1.75 0 0 1 19.25 5.75v12.5A1.75 1.75 0 0 1 17.5 20h-11a1.75 1.75 0 0 1-1.75-1.75V5.75Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M8 8h8M8 12h8M8 16h5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const StudentsIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m3.5 9 8.5-4 8.5 4-8.5 4-8.5-4Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.3v4.1c0 .9 2.24 2.1 5 2.1s5-1.2 5-2.1v-4.1M20.5 9v5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const BuildingIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4.5 20V5.5A1.5 1.5 0 0 1 6 4h8a1.5 1.5 0 0 1 1.5 1.5V20M15.5 9H19a1 1 0 0 1 1 1v10M3 20h18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 8h4M8 12h4M8 16h4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SensorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3v9.2a4 4 0 1 1-3 0V3a1.5 1.5 0 0 1 3 0Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="M10.5 15.5h.01M15.5 6.5h3M15.5 10h2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen((prev) => !prev);
  };

  const openDrawer = (drawer: Exclude<DrawerType, null>) => {
    setActiveDrawer(drawer);
    setApplicationMenuOpen(false);
  };

  const closeDrawer = () => setActiveDrawer(null);

  useEffect(() => {
    if (!activeDrawer) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeDrawer]);

  return (
    <>
      <header className="sticky top-0 z-99999 flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex w-full flex-col lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex w-full items-center justify-between gap-3 px-3 py-3 lg:w-auto lg:justify-start lg:px-0 lg:py-4">
            <button
              type="button"
              className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] lg:h-11 lg:w-11"
              onClick={handleToggle}
              aria-label="Ouvrir ou fermer la barre latérale"
            >
              <MenuIcon open={isMobileOpen} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <SensorIcon />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    Supervision des fours de cuisson
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    Projet tutoré L3 — Kwilu Briques
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleApplicationMenu}
              className="z-99999 flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
              aria-label="Ouvrir le menu du projet"
              aria-expanded={isApplicationMenuOpen}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="6" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="18" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>

          <div
            className={`${
              isApplicationMenuOpen ? "flex" : "hidden"
            } w-full flex-col gap-3 border-t border-gray-200 px-5 py-4 shadow-theme-md dark:border-gray-800 lg:flex lg:w-auto lg:flex-row lg:items-center lg:border-t-0 lg:px-0 lg:py-0 lg:shadow-none`}
          >
            <button
              type="button"
              onClick={() => openDrawer("context")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-white"
            >
              <ProjectIcon />
              Contexte du projet
            </button>

            <button
              type="button"
              onClick={() => openDrawer("students")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03] dark:hover:text-white"
            >
              <StudentsIcon />
              Étudiants
            </button>

            <div className="flex justify-center lg:ml-1">
              <ThemeToggleButton />
            </div>
          </div>
        </div>
      </header>

      {activeDrawer && (
        <div className="fixed inset-0 z-[100000]">
          <button
            type="button"
            className="absolute inset-0 bg-gray-950/45 backdrop-blur-[1px]"
            onClick={closeDrawer}
            aria-label="Fermer le panneau"
          />

          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  {activeDrawer === "context" ? (
                    <ProjectIcon className="h-6 w-6" />
                  ) : (
                    <StudentsIcon className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <h2
                    id="project-drawer-title"
                    className="text-base font-semibold text-gray-900 dark:text-white"
                  >
                    {activeDrawer === "context"
                      ? "Contexte du projet"
                      : "Étudiants"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Projet tutoré L3 — ISTA/Gombe-Matadi
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Fermer"
              >
                <CloseIcon />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeDrawer === "context" ? (
                <div className="space-y-5">
                  <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="mb-3 flex items-center gap-3 text-brand-600 dark:text-brand-400">
                      <BuildingIcon />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Problématique industrielle
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Le projet vise à améliorer le suivi des fours de cuisson
                      de l’usine Kwilu Briques. Le système actuel repose
                      principalement sur des observations, des rondes et des
                      relevés manuels, ce qui limite la supervision continue,
                      la traçabilité et la détection précoce des anomalies.
                    </p>
                  </section>

                  <section className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
                    <div className="mb-3 flex items-center gap-3 text-brand-600 dark:text-brand-400">
                      <SensorIcon />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Solution réalisée
                      </h3>
                    </div>
                    <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Le prototype associe un capteur DHT22, un
                      microcontrôleur ESP32, une communication Wi-Fi, un
                      stockage Redis et une interface Web. Il permet
                      d’acquérir les mesures, de les historiser, de les
                      agréger et de les présenter sous forme d’indicateurs,
                      de tableaux et de graphiques.
                    </p>
                  </section>

                  <section className="rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.03]">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                      Objectifs principaux
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Surveiller les paramètres thermiques en temps réel.</li>
                      <li>• Détecter rapidement les dépassements de seuil.</li>
                      <li>• Conserver un historique exploitable des mesures.</li>
                      <li>• Faciliter la prise de décision des responsables.</li>
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                    Membres du groupe ayant réalisé le projet tutoré.
                    Remplacez les mentions ci-dessous par les noms officiels
                    tels qu’ils figurent sur la page de garde.
                  </p>

                  {[
                    {
                      name: "Étudiant 1",
                      role: "Acquisition et système embarqué",
                    },
                    {
                      name: "Étudiant 2",
                      role: "Développement de l’application Web",
                    },
                    {
                      name: "Étudiant 3",
                      role: "Base de données et historisation",
                    },
                    {
                      name: "Étudiant 4",
                      role: "Tests, documentation et intégration",
                    },
                  ].map((student, index) => (
                    <article
                      key={student.name}
                      className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {student.role}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default AppHeader;
