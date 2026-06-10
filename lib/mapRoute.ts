export function getMapRoute(stage: number | null | undefined): string {
  if (stage === 2) return "/mapa2";
  if (stage === 3) return "/mapa3";
  if (stage === 4) return "/mapa4";
  return "/mapa";
}