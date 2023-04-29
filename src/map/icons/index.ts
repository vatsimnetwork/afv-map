import L from "leaflet";

import atcIconUrl from "./atc.png";
import pilotIconUrl from "./plane.png";
import weatherIconUrl from "./weather.png";

export const pilotIcon = L.icon({
  iconUrl: pilotIconUrl,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

export const controllerIcon = L.icon({
  iconUrl: atcIconUrl,
  iconSize: [10, 18],
  iconAnchor: [5, 18],
  popupAnchor: [0, -18],
});

export const atisIcon = L.icon({
  iconUrl: weatherIconUrl,
  iconSize: [20, 12.05],
  iconAnchor: [10, 6.025],
  popupAnchor: [5, -6.025],
});
