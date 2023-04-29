import { ClientData } from "../types.ts";
import Client from "./client.ts";
import Controller from "./controller.ts";
import Other from "./other.ts";
import Pilot from "./pilot.ts";

export const instantiateClient = (clientData: ClientData) => {
  let client: Client;
  if (clientData.type === "PILOT") {
    client = new Pilot(clientData);
  } else if (clientData.type === "CONTROLLER") {
    client = new Controller(clientData);
  } else if (clientData.type === "OTHER") {
    client = new Other(clientData);
  } else {
    throw new Error(`Unknown client type ${clientData.type}`);
  }

  return client;
};
