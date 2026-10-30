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

    this.setupRangeToggle("toggle-pilot-ranges", "hide-pilot-ranges", true);
    this.setupRangeToggle("toggle-atc-ranges", "hide-atc-ranges", true);
    this.setupRangeToggle("toggle-other-ranges", "hide-other-ranges", false);

    const listEl = document.getElementById("client-list");
    listEl?.addEventListener("click", (e) => {
      const entry = (e.target as HTMLElement).closest(".clientEntry");
      if (entry?.id) {
        this.clientClicked(entry.id);
      }
    });

    void this.reloadMapData();
    setInterval(() => {
      void this.reloadMapData();
    }, 15000);
  }

  setupRangeToggle(inputId: string, hideClass: string, defaultActive: boolean) {
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!input) return;

    input.checked = defaultActive;

    input.addEventListener("change", () => {
      if (input.checked) {
        this.map.getContainer().classList.remove(hideClass);
      } else {
        this.map.getContainer().classList.add(hideClass);
      }
    });
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

    this.setClientsOnline();
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

  setClientsOnline() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const el = document.getElementById("online-count")!;
    const all = Object.values(this.clients);
    const total = all.length;
    const pilots = all.filter((c) => c.clientData.type === "PILOT").length;
    const atc = all.filter((c) => c.clientData.type === "CONTROLLER").length;
    const voi = total - pilots - atc;

    const pilotPct = total > 0 ? (pilots / total) * 100 : 0;
    const atcPct = total > 0 ? (atc / total) * 100 : 0;
    const voiPct = total > 0 ? (voi / total) * 100 : 0;

    el.innerHTML = `
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-label">Online</span>
          <span class="stat-value">${total.toLocaleString("en-US")}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Pilots</span>
          <span class="stat-value stat-pilot">${pilots.toLocaleString(
            "en-US"
          )}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">ATC</span>
          <span class="stat-value stat-atc">${atc.toLocaleString(
            "en-US"
          )}</span>
        </div>
      </div>
      <div class="stats-bar">
        <span class="bar-seg bar-pilot" style="width: ${pilotPct}%"></span>
        <span class="bar-seg bar-atc" style="width: ${atcPct}%"></span>
        <span class="bar-seg bar-voi" style="width: ${voiPct}%"></span>
      </div>`;
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
          `<div class="clientEntry" id='${c.callsign()}'>${c.getListText()}</div>`
      )
      .join("");
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
