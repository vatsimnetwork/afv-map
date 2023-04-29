import L from "leaflet";

import { ClientData } from "../types";

abstract class Client {
  clientData: ClientData;

  markers: Record<string, L.Marker> = {};
  rangeRings: Record<string, L.Circle> = {};

  constructor(clientData: ClientData) {
    this.clientData = clientData;
  }

  public update(map: L.Map, clientData: ClientData) {
    this.clientData = clientData;
    this.upsertMarkers(map);
    this.upsertRangeRings(map);
  }

  public destroy() {
    Object.values(this.markers).forEach((marker) => marker.remove());
    Object.values(this.rangeRings).forEach((rangeRing) => rangeRing.remove());
    this.markers = {};
    this.rangeRings = {};
  }

  abstract upsertMarkers(map: L.Map): void;
  abstract upsertRangeRings(map: L.Map): void;

  abstract getListText(): string;
}

export default Client;
