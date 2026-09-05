import { useEffect, useState } from "react";
import Landing from "./components/Landing";
import Dapp from "./components/Dapp";

function getRoute() {
  return window.location.hash === "#app" ? "app" : "landing";
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  if (route === "app") return <Dapp />;
  return <Landing onEnter={() => (window.location.hash = "#app")} />;
}
