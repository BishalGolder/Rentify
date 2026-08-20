import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { CompareProvider } from "./context/CompareContext";

import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <CompareProvider>
            <App />
        </CompareProvider>
    </BrowserRouter>
);
