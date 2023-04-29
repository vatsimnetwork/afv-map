import L from "leaflet";

import { atisIcon, controllerIcon } from "../icons";
import { ClientData, Transceiver } from "../types";
import { getCenterOfCoordinates } from "../util.ts";
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

  public getListText() {
    const { callsign, frequency, transceivers } = this.clientData;

    const frequencies =
      [frequency] || transceivers.map((t: Transceiver) => t.frequency);
    if (frequencies.length === 0) {
      frequencies.push("No frequency");
    }

    return `<strong>${callsign}</strong> - ${frequencies.join(", ")}`;
  }

  private getPopupContent(frequency = "") {
    const { callsign, name } = this.clientData;
    if (!frequency) {
      frequency = this.clientData.frequency;
    }

    let content = `<strong>${callsign}</strong><br>${frequency}<br>`;
    if (!this.isAtis) {
      content += name + "<br>";
    }

    return content;
  }
}

export default Controller;
