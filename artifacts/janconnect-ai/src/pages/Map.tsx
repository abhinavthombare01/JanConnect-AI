import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  Activity,
  ArrowRight,
  Info,
  MapPin,
  RadioTower,
  Route,
} from "lucide-react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useGetHotspots, useListComplaints } from "@workspace/api-client-react";
import {
  AppShell,
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeading,
  Panel,
  Pill,
} from "@/components/shell";

const cities = ["All cities", "Pune", "Nashik", "Nagpur", "Mumbai", "Thane"] as const;
const categories = [
  "All issues",
  "Water",
  "Road",
  "Transport",
  "Healthcare",
  "Internet",
] as const;
type CityFilter = (typeof cities)[number];
type CategoryFilter = (typeof categories)[number];
type MapView = { center: [number, number]; zoom: number };

const cityViews: Record<CityFilter, MapView> = {
  "All cities": { center: [19.25, 75.1], zoom: 6 },
  Pune: { center: [18.53, 73.87], zoom: 10 },
  Nashik: { center: [19.97, 73.81], zoom: 10 },
  Nagpur: { center: [21.15, 79.09], zoom: 10 },
  Mumbai: { center: [19.11, 72.87], zoom: 10 },
  Thane: { center: [19.22, 72.98], zoom: 11 },
};

function MapFocus({ view }: { view: MapView }) {
  const map = useMap();
  useEffect(() => {
    map.setView(view.center, view.zoom, { animate: true });
  }, [map, view.center, view.zoom]);
  return null;
}

function markerColor(priority: string): string {
  if (priority === "High") return "#bd6556";
  if (priority === "Medium") return "#d59b48";
  return "#4f9775";
}

export default function MapPage() {
  const [city, setCity] = useState<CityFilter>("All cities");
  const [category, setCategory] = useState<CategoryFilter>("All issues");
  const [selected, setSelected] = useState<string | null>(null);
  const queryFilters = {
    ...(city !== "All cities"
      ? {
          city: city as "Pune" | "Nashik" | "Nagpur" | "Mumbai" | "Thane",
        }
      : {}),
    ...(category !== "All issues"
      ? {
          category: category as
            | "Water"
            | "Road"
            | "Transport"
            | "Healthcare"
            | "Internet",
        }
      : {}),
  };
  const hotspots = useGetHotspots(queryFilters);
  const requests = useListComplaints(queryFilters);
  const active = useMemo(
    () =>
      hotspots.data?.find((item) => item.id === selected) ??
      hotspots.data?.[0],
    [hotspots.data, selected],
  );
  const view = selected && active
    ? {
        center: [active.latitude, active.longitude] as [number, number],
        zoom: city === "All cities" ? 7 : 11,
      }
    : cityViews[city];
  const isLoading = hotspots.isLoading || requests.isLoading;
  const isError = hotspots.isError || requests.isError;

  function changeCity(value: CityFilter) {
    setCity(value);
    setSelected(null);
  }

  function changeCategory(value: CategoryFilter) {
    setCategory(value);
    setSelected(null);
  }

  return (
    <AppShell>
      <PageHeading
        eyebrow="Geographic demand"
        title="See where needs gather."
        description="Explore saved requests on OpenStreetMap and calculated hotspot circles. Patterns support human review; they are not service boundaries."
        action={
          <Link
            href="/complaints"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#54736b]"
            data-testid="link-map-requests"
          >
            Browse request records <ArrowRight size={13} />
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#e3ebe4] bg-white p-3 shadow-[0_3px_12px_rgba(29,62,56,.03)]">
        <span className="mr-1 flex items-center gap-1.5 px-2 text-[10px] font-bold text-[#71867d]">
          <Route size={14} className="text-[#ab782f]" /> Map filters
        </span>
        <label className="sr-only" htmlFor="map-city-filter">
          Filter requests by city
        </label>
        <select
          id="map-city-filter"
          value={city}
          onChange={(event) => changeCity(event.target.value as CityFilter)}
          className="h-9 rounded-lg border border-[#dfe9e2] bg-[#fbfcfa] px-3 text-[10px] font-semibold text-[#527067]"
          data-testid="filter-map-city"
        >
          {cities.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="map-category-filter">
          Filter requests by issue category
        </label>
        <select
          id="map-category-filter"
          value={category}
          onChange={(event) =>
            changeCategory(event.target.value as CategoryFilter)
          }
          className="h-9 rounded-lg border border-[#dfe9e2] bg-[#fbfcfa] px-3 text-[10px] font-semibold text-[#527067]"
          data-testid="filter-map-category"
        >
          {categories.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <span className="ml-auto hidden items-center gap-1.5 text-[9px] text-[#91a099] sm:flex">
          <MapPin size={12} /> {requests.data?.length ?? 0} requests on map
        </span>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.55fr)]">
        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#e6ede7] px-5 py-4">
            <div>
              <h2 className="font-[Manrope] text-[14px] font-extrabold text-[#34534d]">
                Request and hotspot map
              </h2>
              <p className="mt-1 text-[10px] text-[#87978f]">
                Individual requests and calculated 1.6 km concentration areas
              </p>
            </div>
            <Pill tone="green">{hotspots.data?.length ?? 0} hotspots</Pill>
          </div>
          {isLoading ? (
            <div className="p-5">
              <LoadingBlock label="Loading request and hotspot coordinates" />
            </div>
          ) : isError ? (
            <div className="p-5">
              <ErrorNotice
                message="Map data could not be loaded."
                retry={() => {
                  void Promise.all([hotspots.refetch(), requests.refetch()]);
                }}
              />
            </div>
          ) : requests.data?.length || hotspots.data?.length ? (
            <div
              className="h-[400px] overflow-hidden sm:h-[495px]"
              data-testid="map-hotspot-plot"
            >
              <MapContainer
                center={view.center}
                zoom={view.zoom}
                scrollWheelZoom
                className="!z-0 h-full w-full"
                aria-label="OpenStreetMap showing citizen requests and calculated civic hotspots"
              >
                <MapFocus view={view} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {hotspots.data?.map((spot) => (
                  <Circle
                    key={spot.id}
                    center={[spot.latitude, spot.longitude]}
                    radius={spot.radiusMeters}
                    pathOptions={{
                      color:
                        spot.severity === "High"
                          ? "#bd6556"
                          : spot.severity === "Medium"
                            ? "#d59b48"
                            : "#4f9775",
                      fillColor:
                        spot.severity === "High"
                          ? "#bd6556"
                          : spot.severity === "Medium"
                            ? "#d59b48"
                            : "#4f9775",
                      fillOpacity: 0.12,
                      weight: 2,
                      dashArray: "5 5",
                    }}
                    eventHandlers={{ click: () => setSelected(spot.id) }}
                  >
                    <Popup>
                      <strong>{spot.locationName}</strong>
                      <br />
                      {spot.requests} requests · {spot.topIssue}
                      <br />
                      {spot.severity} concentration
                    </Popup>
                  </Circle>
                ))}
                {requests.data?.map((request) => {
                  const color = markerColor(request.priority);
                  return (
                    <CircleMarker
                      key={request.id}
                      center={[request.latitude, request.longitude]}
                      radius={request.priority === "High" ? 7 : 5}
                      pathOptions={{
                        color: "#ffffff",
                        weight: 1.5,
                        fillColor: color,
                        fillOpacity: 0.94,
                      }}
                    >
                      <Popup>
                        <strong>Request #{request.id}</strong>
                        <br />
                        {request.locationName}
                        <br />
                        {request.category} · {request.priority} priority
                        {request.isDemo && (
                          <>
                            <br />
                            Synthetic demonstration record
                          </>
                        )}
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                title="No requests to map yet"
                detail="Save a citizen request or add labeled synthetic records to see markers and calculated hotspots."
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#e6ede7] px-5 py-3">
            <span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#829189]">
              Request priority
            </span>
            {[
              ["High", "#bd6556"],
              ["Medium", "#d59b48"],
              ["Low", "#4f9775"],
            ].map(([label, color]) => (
              <span
                key={label}
                className="flex items-center gap-1.5 text-[9px] font-semibold text-[#667e73]"
              >
                <i
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[9px] text-[#829189]">
              <RadioTower size={11} /> Dashed rings mark areas with at least 3
              requests
            </span>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <div className="border-b border-[#e7eee8] bg-[#f9fbf8] px-5 py-4">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-[#368063]" />
                <h2 className="text-[12px] font-extrabold text-[#36574e]">
                  Area detail
                </h2>
              </div>
            </div>
            {active ? (
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-[Manrope] text-[18px] font-extrabold leading-tight tracking-[-.04em] text-[#244044]">
                      {active.locationName}
                    </p>
                    <p className="mt-1 text-[10px] text-[#83938c]">
                      {active.city}
                    </p>
                  </div>
                  <Pill
                    tone={
                      active.severity === "High"
                        ? "red"
                        : active.severity === "Medium"
                          ? "amber"
                          : "green"
                    }
                  >
                    {active.severity} severity
                  </Pill>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#f3f7f3] p-3">
                    <p className="text-[9px] text-[#84958c]">Requests</p>
                    <strong className="mt-1 block font-[Manrope] text-[22px] font-extrabold tracking-[-.04em] text-[#31554a]">
                      {active.requests}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-[#f3f7f3] p-3">
                    <p className="text-[9px] text-[#84958c]">High priority</p>
                    <strong className="mt-1 block font-[Manrope] text-[22px] font-extrabold tracking-[-.04em] text-[#a95648]">
                      {active.highPriority}
                    </strong>
                  </div>
                </div>
                <div className="mt-4 border-t border-[#edf1ed] pt-4">
                  <p className="text-[9px] font-bold uppercase tracking-[.12em] text-[#899991]">
                    Most common issue
                  </p>
                  <p className="mt-1 text-[12px] font-bold text-[#47665b]">
                    {active.topIssue}
                  </p>
                  <p className="mt-3 text-[9px] text-[#97a39d]">
                    Approx. concentration radius{" "}
                    {active.radiusMeters.toLocaleString()} m
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[11px] leading-relaxed text-[#87978f]">
                  Add at least three requests in an area to calculate a hotspot.
                </p>
              </div>
            )}
          </Panel>

          <Panel>
            <div className="px-5 pt-5">
              <h2 className="text-[12px] font-extrabold text-[#36574e]">
                Areas in view
              </h2>
              <p className="mt-1 text-[10px] text-[#899991]">
                Select an area to focus the map.
              </p>
            </div>
            <div className="max-h-[265px] overflow-y-auto px-3 pb-3 pt-2">
              {hotspots.data?.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => setSelected(spot.id)}
                  data-testid={`button-area-${spot.id}`}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active?.id === spot.id
                      ? "bg-[#edf5ee]"
                      : "hover:bg-[#f7faf7]"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      spot.severity === "High"
                        ? "bg-[#bd6556]"
                        : spot.severity === "Medium"
                          ? "bg-[#d59b48]"
                          : "bg-[#4f9775]"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10px] font-bold text-[#49645b]">
                      {spot.locationName}
                    </span>
                    <span className="mt-0.5 block text-[9px] text-[#8a9993]">
                      {spot.city} · {spot.topIssue}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] font-bold text-[#55756a]">
                    {spot.requests}
                  </span>
                </button>
              ))}
              {!hotspots.isLoading && !hotspots.data?.length && (
                <p className="px-3 py-4 text-[10px] text-[#899991]">
                  No areas have enough matching requests yet.
                </p>
              )}
            </div>
          </Panel>

          <div className="flex gap-2 rounded-xl border border-[#e6ecdf] bg-[#f7f9f2] p-4 text-[10px] leading-[1.65] text-[#77877d]">
            <Info size={14} className="mt-0.5 shrink-0 text-[#a47a38]" />
            Coordinates are approximate area centers, not exact addresses.
            Hotspots reflect saved requests and may include synthetic records.
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#e6ece7] bg-white px-4 py-3 text-[10px] text-[#7d8e87]">
        <RadioTower size={14} className="text-[#9f772f]" />
        Synthetic records may contribute to aggregate areas. Review labels in
        the request table.
        <Link
          href="/about"
          className="ml-auto whitespace-nowrap font-bold text-[#17695f]"
          data-testid="link-map-disclaimer"
        >
          About this data
        </Link>
      </div>
    </AppShell>
  );
}