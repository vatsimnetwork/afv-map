import L from "leaflet";

import { atisIcon } from "../icons";
import { ClientData, Transceiver } from "../types.ts";
import Client from "./client.ts";

class Other extends Client {
  constructor(clientData: ClientData) {
    super(clientData);
  }

  private get isAtis() {
    return this.clientData.callsign.includes("_ATIS");
  }

  public upsertMarkers(map: L.Map) {
    const { callsign, transceivers } = this.clientData;
    if (!this.isAtis) {
      return;
    }

    const newTransceiverIds = transceivers.map((t: Transceiver) =>
      t.id.toString()
    );
    const oldTransceivers = Object.keys(this.markers).filter(
      (i) => !newTransceiverIds.includes(i)
    );
    for (const id of oldTransceivers) {
      this.markers[id].remove();
      delete this.markers[id];
    }

    for (const transceiver of transceivers) {
      const { id, frequency, latitude, longitude } = transceiver;
      const content = `<strong>${callsign}</strong><br>${frequency}`;

      const marker = this.markers[id];
      if (marker) {
        marker.setLatLng([latitude, longitude]);
        marker.setPopupContent(content);
      } else {
        this.markers.controller = L.marker([latitude, longitude], {
          icon: atisIcon,
        })
          .bindPopup(content)
          .addTo(map);
      }
    }
  }

  public upsertRangeRings(map: L.Map) {
    const { callsign, transceivers } = this.clientData;

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
      const { id, frequency, latitude, longitude, radius } = transceiver;

      let content = `<strong>${callsign}</strong><br>`;
      if (this.isAtis) {
        content += frequency + "<br>";
      }

      const rangeRing = this.rangeRings[id];
      if (rangeRing) {
        rangeRing.setLatLng([latitude, longitude]);
        rangeRing.setRadius(radius);
      } else {
        this.rangeRings[transceiver.id] = L.circle([latitude, longitude], {
          radius: radius,
          fillOpacity: 0.2,
          color: "#ff0000",
          weight: 1,
          className: "other-range",
        })
          .bindPopup(content)
          .addTo(map);
      }
    }
  }

  public getListText() {
    const { callsign, transceivers } = this.clientData;

    let frequencies = transceivers.map((t: Transceiver) => t.frequency);
    if (frequencies.length === 0) {
      frequencies.push("No frequency");
    }

    frequencies = [...new Set(frequencies)];

    return `<strong>${callsign}</strong> - ${frequencies.join(
      ", "
    )} [VOI only]`;
  }
}

export default Other;
