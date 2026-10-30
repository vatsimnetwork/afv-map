import L from "leaflet";
import "leaflet-marker-rotation";

import { pilotIcon } from "../icons";
import { ClientData, Transceiver } from "../types.ts";
import { renderListEntry } from "../util.ts";
import Client from "./client.ts";

class Pilot extends Client {
  markers: Record<string, L.RotatedMarker> = {};

  constructor(clientData: ClientData) {
    super(clientData);
  }

  public upsertMarkers(map: L.Map) {
    const { latitude, longitude, heading } = this.clientData;
    const content = this.getPopupContent();

    const marker = this.markers.pilot;
    if (marker) {
      marker.setLatLng([latitude, longitude]);
      marker.setRotationAngle(heading);
      marker.setPopupContent(content);
    } else {
      this.markers.pilot = L.rotatedMarker([latitude, longitude], {
        icon: pilotIcon,
        rotationAngle: heading,
        rotationOrigin: "center",
      })
        .bindPopup(content)
        .addTo(map);
    }
  }

  public upsertRangeRings(map: L.Map) {
    const { transceivers } = this.clientData;
    const content = this.getPopupContent();

    const newTransceiverIds = transceivers.map((t: Transceiver) =>
      t.id.toString()
    );
    const oldTransceivers = Object.keys(this.rangeRings).filter(
      (i) => !newTransceiverIds.includes(i)
    );
    for (const id of oldTransceivers) {
      this.rangeRings[id].remove();
      delete this.rangeRings[id];
    }

    for (const transceiver of transceivers) {
      const { id, latitude, longitude, radius } = transceiver;

      const rangeRing = this.rangeRings[id];
      if (rangeRing) {
        rangeRing.setLatLng([latitude, longitude]);
        rangeRing.setRadius(radius);
      } else {
        this.rangeRings[transceiver.id] = L.circle([latitude, longitude], {
          radius: radius,
          fillOpacity: 0.2,
          color: "#19e119",
          weight: 1,
          className: "pilot-range",
        })
          .bindPopup(content)
          .addTo(map);
      }
    }
  }

  public getListText() {
    const { callsign, transceivers } = this.clientData;

    return renderListEntry(
      callsign,
      transceivers.map((t: Transceiver) => t.frequency),
      "pilot"
    );
  }

  private getPopupContent() {
    const { callsign, name, altitude, groundspeed, transceivers } =
      this.clientData;
    const fp = this.clientData.flight_plan;
    const freqs = [
      ...new Set(transceivers.map((t: Transceiver) => t.frequency)),
    ];
    const freqText = freqs.length > 0 ? freqs.join(" · ") : "—";

    const routeHtml = fp
      ? `<div class="popup-route">
          <span class="route-icao">${fp.departure || "----"}</span>
          <span class="route-arrow">→</span>
          <span class="route-icao">${fp.arrival || "----"}</span>
        </div>`
      : `<div class="popup-route popup-route-empty">No flight plan</div>`;

    return `<div class="map-popup">
      <div class="popup-header">
        <span class="kind-dot kind-pilot"></span>
        <span class="popup-callsign">${callsign}</span>
      </div>
      <div class="popup-name">${name}</div>
      ${routeHtml}
      <div class="popup-metrics">
        <div class="popup-metric">
          <span class="metric-label">ALT</span>
          <span class="metric-val">${altitude.toLocaleString("en-US")} ft</span>
        </div>
        <div class="popup-metric">
          <span class="metric-label">GS</span>
          <span class="metric-val">${groundspeed} kt</span>
        </div>
        <div class="popup-metric">
          <span class="metric-label">FREQ</span>
          <span class="metric-val">${freqText}</span>
        </div>
      </div>
    </div>`;
  }

  public position(): L.LatLngExpression {
    return { lat: this.clientData.latitude, lng: this.clientData.longitude };
  }
}

export default Pilot;
