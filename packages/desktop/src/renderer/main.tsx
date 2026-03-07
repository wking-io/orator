import { createRoot } from "@remix-run/component";
import { Launcher } from "./launcher";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element");

createRoot(root).render(<Launcher />);
