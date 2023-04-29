import { LatLngExpression } from "leaflet";
import { RotatedMarker, RotatedMarkerOptions } from "leaflet-marker-rotation";

declare module "leaflet" {
  export as namespace L;

  export { RotatedMarker };
  export function rotatedMarker(
    latlng: LatLngExpression,
    options?: RotatedMarkerOptions
  ): RotatedMarker;
}

type ClientData = {
  type: string;
  callsign: string;
  transceivers: Transceiver[];

  // FSD clients
  name: string;

  // Pilot clients
  latitude: number;
  longitude: number;
  heading: number;
  altitude: number;
  groundspeed: number;
  flight_plan: {
    departure: string;
    arrival: string;
  };

  // Controller clients
  frequency: string;
};

type Transceiver = {
  id: number;
  frequency: string;
  latitude: number;
  longitude: number;
  radius: number;
};
