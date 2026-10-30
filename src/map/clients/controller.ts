import L from "leaflet";

import { atisIcon, controllerIcon } from "../icons";
import { ClientData, Transceiver } from "../types";
import { getCenterOfCoordinates, renderListEntry } from "../util.ts";
import Client from "./client.ts";

class Controller extends Client {
  constructor(clientData: ClientData) {
    super(clientData);
  }

  private get isAtis() {
    return this.clientData.callsign.includes("_ATIS");
  }

  public upsertMarkers(map: L.Map) {
    const { transceivers } = this.clientData;

    if (transceivers.length === 0) {
      return;
    }

    const [lat, lon] = getCenterOfCoordinates(transceivers);
    const content = this.getPopupContent();

    const marker = this.markers.controller;
    if (marker) {
      marker.setLatLng([lat, lon]);
      marker.setPopupContent(content);
    } else {
      this.markers.controller = L.marker([lat, lon], {
        icon: this.isAtis ? atisIcon : controllerIcon,
      })
        .bindPopup(content)
        .addTo(map);
    }
  }

  public upsertRangeRings(map: L.Map) {
    const { transceivers } = this.clientData;

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
      const content = this.getPopupContent(transceiver.frequency);

      const rangeRing = this.rangeRings[id];
      if (rangeRing) {
        rangeRing.setLatLng([latitude, longitude]);
        rangeRing.setRadius(radius);
      } else {
        this.rangeRings[transceiver.id] = L.circle([latitude, longitude], {
          radius: radius,
          fillOpacity: 0.2,
          color: "#19e1e1",
          weight: 1,
          className: "atc-range",
        })
          .bindPopup(content)
          .addTo(map);
      }
    }
  }

  private getFrequencies(): string[] {
    const { frequency, transceivers } = this.clientData;

    const frequencies = new Set<string>();
    if (frequency) {
      frequencies.add(frequency);
    }
    transceivers.forEach((t: Transceiver) => frequencies.add(t.frequency));

    return Array.from(frequencies);
  }

  public getListText() {
    const { callsign, frequency } = this.clientData;
    const kind = frequency === "199.998" ? "obs" : "atc";

    return renderListEntry(callsign, this.getFrequencies(), kind);
  }

  private getPopupContent(frequency = "") {
    const { callsign, name } = this.clientData;
    const kind = this.clientData.frequency === "199.998" ? "obs" : "atc";
    if (!frequency) {
      frequency = this.getFrequencies().join(" · ") || "—";
    }

    return `<div class="map-popup">
      <div class="popup-header">
        <span class="kind-dot kind-${kind}"></span>
        <span class="popup-callsign">${callsign}</span>
      </div>
      ${!this.isAtis ? `<div class="popup-name">${name}</div>` : ""}
      <div class="popup-freq-block">${frequency}</div>
    </div>`;
  }

  public position(): L.LatLngExpression {
    const { transceivers } = this.clientData;
    const [lat, lon] = getCenterOfCoordinates(transceivers);
    return { lat: lat, lng: lon };
  }
}

export default Controller;
