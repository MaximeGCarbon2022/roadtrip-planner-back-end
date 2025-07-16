import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { existsSync, readFileSync, writeFileSync } from "fs";
import webTokens from "jsonwebtoken";
import { join } from "path";
import { serve, setup } from "swagger-ui-express";
import { parse } from "yaml";
const { json } = bodyParser;
const { sign, verify } = webTokens;

import { readFile } from "fs/promises";
import { countryFields } from "./constants.js";
import { readRoadtrip, writeRoadtrip } from "./fileStorage.js";
import Roadtrip from "./model/roadtrip.model.js";
import randomizeOrder from "./randomizer.js";

const file = readFileSync("./swagger.yml", "utf8");
const swaggerSpec = parse(file);

const app = express();

const dataFilePath = join(import.meta.dirname, "roadtrip.json");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const LOGIN = process.env.LOGIN;
const PASSWORD = process.env.PASSWORD;
const PORT = 3000;

if (!ACCESS_TOKEN_SECRET) {
  console.error("Missing ACCESS_TOKEN_SECRET in .env file");
  process.exit(1);
}

if (!LOGIN) {
  console.error("Missing LOGIN in .env file");
  process.exit(1);
}
if (!PASSWORD) {
  console.error("Missing PASSWORD in .env file");
  process.exit(1);
}

// Ensure the data file exists
if (!existsSync(dataFilePath)) {
  writeFileSync(
    dataFilePath,
    JSON.stringify(new Roadtrip([], null, null), null, 2),
    "utf8"
  );
  console.log("roadtrip.json file created with initial empty roadtrip.");
}

app.use(json());
app.use(cors());

// ---------- Middleware ---------- //

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Missing token" });

  verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// ---------- Auth Routes ---------- //

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === LOGIN && password === PASSWORD) {
    const user = { username };
    const accessToken = sign(user, ACCESS_TOKEN_SECRET);

    res.json({ accessToken, username: user.username });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

app.post("/api/logout", authenticateToken, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// ---------- Country API Routes ---------- //

app.get("/api/countries", authenticateToken, async (req, res) => {
  try {
    const data = await readFile(
      join(import.meta.dirname, "countries.json"),
      "utf8"
    ).then((fileContent) => JSON.parse(fileContent));

    const page = parseInt(req.query.page);
    const pageSize = parseInt(req.query.pageSize);

    if ((page && !pageSize) || (!page && pageSize)) {
      return res.status(400).json({
        message:
          "Invalid pagination parameters. Provide both page and pageSize or none.",
      });
    }

    if (!isNaN(page) && !isNaN(pageSize) && page > 0 && pageSize > 0) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = data.slice(startIndex, endIndex);

      return res.json({
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
        data: paginatedData,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch countries" });
  }
});

// Paginated countries by name using URL parameter
app.get("/api/countries/name/:name", authenticateToken, async (req, res) => {
  const { name } = req.params;
  if (!name) return res.status(400).json({ message: "Missing name parameter" });

  const page = parseInt(req.query.page);
  const pageSize = parseInt(req.query.pageSize);

  if (
    (page && !pageSize) ||
    (!page && pageSize) ||
    isNaN(page) ||
    isNaN(pageSize)
  ) {
    return res.status(400).json({
      message:
        "Invalid pagination parameters. Provide both page and pageSize or none.",
    });
  }

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(
        name
      )}?fields=${countryFields.join(",")}`
    );
    if (response.status === 404) {
      return res.status(404).json({ message: "Country not found" });
    }

    const data = await response.json();

    if (page > 0 && pageSize > 0) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = data.slice(startIndex, endIndex);

      return res.json({
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
        data: paginatedData,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch country by name" });
  }
});

// Country by codes cca3 using URL parameter
app.get("/api/countries/codes", authenticateToken, async (req, res) => {
  const { codes } = req.query;
  if (!codes) {
    return res.status(400).json({ message: "Missing 'codes' query parameter" });
  }

  const codeList = codes.split(",");

  if (
    !codeList.length ||
    !codeList.every((code) => typeof code === "string" && code.length === 3)
  ) {
    return res.status(400).json({
      message:
        "Invalid 'codes' query parameter. Must be comma-separated 3-letter uppercase codes.",
    });
  }

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha?codes=${codeList.join(
        ","
      )}&fields=${countryFields.join(",")}`
    );

    if (response.status === 404) {
      return res
        .status(404)
        .json({ message: "Countries not found for provided codes" });
    }

    const data = await response.json();
    const sortedCountries = codeList.map((code) =>
      data.find((country) => country.cca3 === code)
    );
    res.json(sortedCountries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch countries by codes" });
  }
});

// Country by code cca3 using URL parameter
app.get("/api/countries/codes/:code", authenticateToken, async (req, res) => {
  const { code } = req.params;
  if (!code || typeof code !== "string" || code.length !== 3) {
    return res.status(400).json({ message: "Invalid code parameter" });
  }

  try {
    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${encodeURIComponent(
        code
      )}?fields=${countryFields.join(",")}`
    );
    if (response.status === 404) {
      return res.status(404).json({ message: "Country not found" });
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch country by code" });
  }
});

// ---------- Roadtrip API Routes ---------- //

// Get the roadtrip
app.get("/api/roadtrip", authenticateToken, (req, res) => {
  const roadtrip = readRoadtrip();
  const randomizedCountries = randomizeOrder(roadtrip.countries);

  res.json(new Roadtrip(randomizedCountries));
});

// Save the roadtrip
app.put("/api/roadtrip", authenticateToken, (req, res) => {
  const { countries } = req.body;
  if (!Array.isArray(countries)) {
    return res.status(400).json({ message: "Invalid countries array." });
  }

  const roadtrip = new Roadtrip(
    countries
    // startDate, endDate
  );
  writeRoadtrip(roadtrip);
  res.status(200).json(roadtrip);
});

// Get all roadtrip countries
app.get("/api/roadtrip/countries", authenticateToken, (_req, res) => {
  const data = readRoadtrip();
  res.json(randomizeOrder(data.countries));
});

// Add a new roadtrip country
app.post("/api/roadtrip/countries", authenticateToken, (req, res) => {
  try {
    const newCountryId = req.body.cca3;

    if (!newCountryId || typeof newCountryId !== "string") {
      return res.status(400).json({ message: "Invalid country cca3 id." });
    }

    const data = readRoadtrip();
    const exists = data.countries.some(
      (countryId) => countryId === newCountryId
    );

    if (exists) {
      return res
        .status(409)
        .json({ message: "Roadtrip already countains this country." });
    }

    data.countries.push(newCountryId);
    writeRoadtrip(data);

    res.status(201).send();
  } catch (error) {
    console.error("Error adding country to roadtrip:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a roadtrip country by ID
app.delete("/api/roadtrip/countries/:cca3", authenticateToken, (req, res) => {
  const { cca3 } = req.params;

  const roadtrip = readRoadtrip();
  const filteredCountries = roadtrip.countries.filter(
    (countryId) => countryId !== cca3
  );

  if (roadtrip.countries.length === filteredCountries.length) {
    return res.status(404).json({ message: "Country not found." });
  }

  writeRoadtrip(new Roadtrip(filteredCountries));
  res.status(200).send(roadtrip);
});

// ---------- Swagger UI ---------- //

app.use("/api-docs", serve, setup(swaggerSpec, { explorer: true }));

// ---------- Start Server ---------- //

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
