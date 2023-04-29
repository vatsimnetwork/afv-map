import { dom, library } from "@fortawesome/fontawesome-svg-core";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/css/bootstrap.css";
import "leaflet/dist/leaflet.css";

import { TransceiverMap } from "./map";
import "./style.css";

library.add(faSpinner);
dom.watch();

new TransceiverMap("map");
