import L from "leaflet";

import Client from "./clients/client.ts";
import { instantiateClient } from "./clients/factory.ts";
import { ClientData } from "./types.ts";

// Map Layers
const cartoKey = import.meta.env.VITE_CARTO_API_KEY;

const basic = L.tileLayer(
  `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    minZoom: 0,
  }
);

const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

const satellite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    attribution: '&copy; <a href="http://www.esri.com/">Esri</a>',
  }
);

const dark = L.tileLayer(
  `https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    minZoom: 0,
  }
);

export class TransceiverMap {
  private readonly map: L.Map;
  private clients: Record<string, Client> = {};
  private filteredCallsigns: string[];

  constructor(element: string | HTMLElement) {
    this.map = L.map(element, {
      center: [0, 0],
      zoom: 2,
    });

    const queryArgs = new URLSearchParams(window.location.search);
    this.filteredCallsigns = queryArgs.getAll("callsign");

    const maps = {
      Dark: dark,
      Basic: basic,
      Streets: streets,
      Satellite: satellite,
    };
    dark.addTo(this.map);
    L.control.layers(maps).addTo(this.map);

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    document
      .getElementById("toggle-pilot-ranges")!
      .addEventListener("click", () =>
        this.toggleMapClass("hide-pilot-ranges")
      );
    document
      .getElementById("toggle-atc-ranges")!
      .addEventListener("click", () => this.toggleMapClass("hide-atc-ranges"));
    document
      .getElementById("toggle-other-ranges")!
      .addEventListener("click", () =>
        this.toggleMapClass("hide-other-ranges")
      );
    /* eslint-enable @typescript-eslint/no-non-null-assertion */

    void this.reloadMapData();
    setInterval(() => {
      void this.reloadMapData();
    }, 15000);
  }

  async reloadMapData() {
    const response = await fetch("/map-data");
    const data = (await response.json()) as { clients: ClientData[] };

    for (const client of data.clients) {
      if (
        this.filteredCallsigns.length > 0 &&
        !this.filteredCallsigns.includes(client.callsign)
      ) {
        continue;
      }

      this.upsertClient(client);
    }

    this.removeClients(this.findDisconnectedClients(data.clients));

    this.setClientsOnline(Object.keys(this.clients).length);
    this.setClientList();
  }

  upsertClient(clientData: ClientData) {
    const { callsign } = clientData;

    let client = this.clients[callsign];
    if (!client) {
      client = instantiateClient(clientData);
    }

    client.update(this.map, clientData);

    this.clients[callsign] = client;
  }

  findDisconnectedClients(clientsData: ClientData[]) {
    const oldCallsigns = Object.keys(this.clients);
    const newCallsigns = clientsData.map((c: ClientData) => c.callsign);

    return oldCallsigns.filter((c) => !newCallsigns.includes(c));
  }

  removeClients(callsigns: string[]) {
    for (const callsign of callsigns) {
      this.removeClient(callsign);
    }
  }

  removeClient(callsign: string) {
    this.clients[callsign].destroy();
    delete this.clients[callsign];
  }

  setClientsOnline(num: number) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = document.getElementById("online-count")!;
    el.innerText = `${num} clients connected`;
  }

  setClientList() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = document.getElementById("client-list")!;

    const clients = Object.values(this.clients).sort((a, b) => {
      if (a.clientData.callsign < b.clientData.callsign) return -1;
      if (a.clientData.callsign > b.clientData.callsign) return 1;
      return 0;
    });

    el.innerHTML = clients
      .map(
        (c: Client) =>
          `<div class="text-white clientEntry" id='${c.callsign()}'>${c.getListText()}</div>`
      )
      .join("");

    const clientEls = document.getElementsByClassName("clientEntry");
    for (const i of clientEls) {
      i.addEventListener("click", () => {
        this.clientClicked(i.id);
      });
    }
  }

  clientClicked(callsign: string) {
    const client = this.clients[callsign];
    console.log(client);
    let zoom = this.map.getZoom();
    if (zoom < 3) zoom = 3;
    this.map.setView(client.position(), zoom);
  }

  toggleMapClass(className: string) {
    const el = this.map.getContainer();
    el.classList.toggle(className);
  }
}
