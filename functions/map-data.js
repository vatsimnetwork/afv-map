const getMapData = async () => {
  const fsdResp = await fetch("https://data.vatsim.net/v3/vatsim-data.json");
  const dataFeed = await fsdResp.json();

  const afvResp = await fetch(
    "https://data.vatsim.net/v3/transceivers-data.json"
  );
  const voiceClients = await afvResp.json();

  const transceivers = {};
  for (const voiceClient of voiceClients) {
    transceivers[voiceClient.callsign] = voiceClient.transceivers.map(
      (transceiver) => {
        const frequency = (transceiver.frequency / 1000000).toFixed(3);

        let height = transceiver.heightMslM;
        if (height <= 0) height = 50;

        let radius = 4193.18014745372 * Math.sqrt(height);
        // UNICOM Max Range = 15nm => 27780m
        if (frequency === "122.800" && radius > 27780) {
          radius = 27780;
        }

        return {
          id: transceiver.id,
          frequency: (transceiver.frequency / 1000000).toFixed(3),
          latitude: transceiver.latDeg,
          longitude: transceiver.lonDeg,
          radius,
        };
      }
    );
  }

  const clients = [];

  for (const pilot of dataFeed.pilots) {
    clients.push({
      type: "PILOT",
      callsign: pilot.callsign,
      name: pilot.name,
      latitude: pilot.latitude,
      longitude: pilot.longitude,
      heading: pilot.heading,
      altitude: pilot.altitude,
      groundspeed: pilot.groundspeed,
      flight_plan: pilot.flight_plan
        ? {
            departure: pilot.flight_plan.departure,
            arrival: pilot.flight_plan.arrival,
          }
        : null,
      transceivers: transceivers[pilot.callsign] || [],
    });
    delete transceivers[pilot.callsign];
  }

  for (const controller of dataFeed.controllers) {
    clients.push({
      type: "CONTROLLER",
      callsign: controller.callsign,
      name: controller.name,
      frequency: controller.frequency,
      transceivers: transceivers[controller.callsign] || [],
    });
    delete transceivers[controller.callsign];
  }

  for (const callsign in transceivers) {
    clients.push({
      type: "OTHER",
      callsign,
      transceivers: transceivers[callsign],
    });
  }

  return new Response(JSON.stringify({ clients }), {
    headers: {
      "content-type": "application/json",
    },
  });
};

export const onRequestGet = [getMapData];
