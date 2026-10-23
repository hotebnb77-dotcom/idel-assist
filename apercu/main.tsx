// Point d'entrée de l'aperçu autonome (un seul fichier HTML), mêmes composants que l'app Next.js.
import { createRoot } from "react-dom/client";
import "../src/app/globals.css";
import App from "../src/components/App";

createRoot(document.getElementById("root")!).render(<App />);
