/** Public presentation entry points; never reads or changes game state. */
export function presentationRoute(pathname: string, search: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const query = new URLSearchParams(search);
  if (path === "/product" || query.get("product") === "reveal") return "product";
  if (path === "/play" || query.get("tabletop") === "cards") return "spatial";
  if (query.get("tabletop") === "1") return "prototype";
  return "original";
}
