import { SectionPlaceholder } from "@/components/SectionPlaceholder";

export default function RegioesPage() {
  return (
    <SectionPlaceholder
      titulo="Regiões"
      cards={[
        {
          titulo: "Mapa mundial (heatmap)",
          nota: "O evento de analytics já suporta country/state/city/lat/lon, mas quase nenhum job real tem essa geolocalização preenchida ainda (o Pivot captura isso só quando o utilizador informa cidade/país no trabalho). O mapa com drill-down país → estado → cidade será implementado quando houver volume real suficiente para não expor um único workspace por país.",
        },
        { titulo: "Ranking de regiões por ticket médio" },
      ]}
    />
  );
}
