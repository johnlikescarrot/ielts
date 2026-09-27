import React from "react";
import ReactDOM from "react-dom/client";
import { DashboardApp } from "./DashboardApp";
import { AstryxProvider } from "../components/common/AstryxProvider";
import "../styles/globals.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AstryxProvider>
        <DashboardApp />
      </AstryxProvider>
    </React.StrictMode>,
  );
}
