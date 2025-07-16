import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import Roadtrip from "./model/roadtrip.model.js";

const dataFilePath = join(import.meta.dirname, "roadtrip.json");

function readRoadtrip() {
  try {
    const jsonData = readFileSync(dataFilePath, "utf8");
    const countries = JSON.parse(jsonData);

    return new Roadtrip(countries);
  } catch (err) {
    console.error("Error reading data file:", err);
    return {};
  }
}

function writeRoadtrip(data) {
  try {
    if (!(data instanceof Roadtrip)) {
      throw new Error("Data must be an instance of Roadtrip");
    }

    writeFileSync(dataFilePath, JSON.stringify(data.countries, null, 2));
  } catch (err) {
    console.error("Error writing to data file:", err);
  }
}

export { readRoadtrip, writeRoadtrip };
