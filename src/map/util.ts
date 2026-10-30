import { Transceiver } from "./types.ts";

export function getCenterOfCoordinates(transceivers: Transceiver[]) {
  if (transceivers.length === 1) {
    return [transceivers[0].latitude, transceivers[0].longitude];
  }

  let X = 0.0;
  let Y = 0.0;
  let Z = 0.0;

  for (const txr of transceivers) {
    const lat = (txr.latitude * Math.PI) / 180;
    const lon = (txr.longitude * Math.PI) / 180;
    const a = Math.cos(lat) * Math.cos(lon);
    const b = Math.cos(lat) * Math.sin(lon);
    const c = Math.sin(lat);

    X += a;
    Y += b;
    Z += c;
  }

  X /= transceivers.length;
  Y /= transceivers.length;
  Z /= transceivers.length;

  const lon = Math.atan2(Y, X);
  const hyp = Math.sqrt(X * X + Y * Y);
  const lat = Math.atan2(Z, hyp);

  const finalLat = (lat * 180) / Math.PI;
  const finalLng = (lon * 180) / Math.PI;

  return [finalLat, finalLng];
}

export type ClientKind = "pilot" | "atc" | "obs" | "voi";

const kindTitles: Record<ClientKind, string> = {
  pilot: "Pilot",
  atc: "ATC",
  obs: "Observer",
  voi: "Voice only",
};

export function renderListEntry(
  callsign: string,
  frequencies: string[],
  kind: ClientKind
) {
  const unique = [...new Set(frequencies)];
  const freqText =
    unique.length > 0
      ? unique.join(`<span class="freq-sep">·</span>`)
      : `<span class="freq-none">—</span>`;

  return `<span class="kind-dot kind-${kind}" title="${kindTitles[kind]}"></span>
    <span class="entry-callsign">${callsign}</span>
    <span class="entry-freqs">${freqText}</span>`;
}
