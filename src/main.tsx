import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import SpatialApp from "./SpatialApp";
import "./styles.css";
import "./spatial.css";
import "./experience/experience.css";

const ExperienceRoot = lazy(() => import("./experience/ExperienceRoot"));

function AppEntry() {
  const experience =
    new URLSearchParams(window.location.search).get("experience") ??
    import.meta.env.VITE_EXPERIENCE;

  if (experience === "engine-room") {
    return (
      <Suspense fallback={<div className="experience-root" aria-label="Starting Engine Room" />}>
        <ExperienceRoot />
      </Suspense>
    );
  }

  return (
    <>
      <SpatialApp />
      {import.meta.env.DEV && (
        <a className="experience-dev-entry" href="?experience=engine-room">
          Open Engine Room proof
        </a>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppEntry />
  </React.StrictMode>,
);
