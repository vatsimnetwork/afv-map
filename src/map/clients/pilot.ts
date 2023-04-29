import L from "leaflet";
import "leaflet-marker-rotation";

import { pilotIcon } from "../icons";
import { ClientData, Transceiver } from "../types.ts";
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

    const frequencies = transceivers.map((t: Transceiver) => t.frequency);
    if (frequencies.length === 0) {
      frequencies.push("No frequency");
    }

    return `<strong>${callsign}</strong> - ${frequencies.join(", ")}`;
  }

  private getPopupContent() {
    const { callsign, name, altitude, groundspeed } = this.clientData;
    const fp = this.clientData.flight_plan;

    let content = `<strong>${callsign}</strong><br>${name}<br>`;

    if (fp) {
      content += `${fp.departure} -> ${fp.arrival}<br>`;
    } else {
      content += "No flightplan<br>";
    }

    content += `${altitude}ft - GS${groundspeed}<br>`;

    return content;
  }
}

export default Pilot;
