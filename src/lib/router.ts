import { useCallback, useEffect, useState } from "react";

export interface Route {
  path: string;
  parts: string[];
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const clean = raw.split("?")[0].replace(/\/+$/, "");
  return { path: clean, parts: clean ? clean.split("/") : [] };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function navigate(to: string): void {
  window.location.hash = to.startsWith("#") ? to : `#/${to.replace(/^\//, "")}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function useNavigate() {
  return useCallback((to: string) => navigate(to), []);
}
