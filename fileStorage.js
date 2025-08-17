import Roadtrip from "./model/roadtrip.model.js";

let inMemoryRoadtrip = { countries: [] };

function readRoadtrip() {
  try {
    return new Roadtrip(inMemoryRoadtrip.countries);
  } catch (err) {
    console.error("Error reading roadtrip data:", err);
    return new Roadtrip([]);
  }
}

function writeRoadtrip(data) {
  try {
    if (!(data instanceof Roadtrip)) {
      throw new Error("Data must be an instance of Roadtrip");
    }

    inMemoryRoadtrip.countries = [...data.countries];
    console.log("Roadtrip saved in memory:", inMemoryRoadtrip.countries);
  } catch (err) {
    console.error("Error saving roadtrip data:", err);
  }
}

export { readRoadtrip, writeRoadtrip };
