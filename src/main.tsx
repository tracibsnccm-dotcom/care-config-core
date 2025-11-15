import { createRoot } from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./auth/supabaseAuth";
import SignIn from "./SignIn";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
  <AuthProvider>
    <SignIn />
  </AuthProvider>
);

