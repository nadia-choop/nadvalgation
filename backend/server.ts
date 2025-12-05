import express, { Express } from "express";
import cors from "cors";
import { WeatherResponse } from "@full-stack/types";
import fetch from "node-fetch";
console.log("1. Starting server.ts");

import collectionRoutes from "./routes/collections";
console.log("2. Routes imported");

const app: Express = express();
console.log("3. Express app created");

const hostname = "0.0.0.0";
const port = 8080;

app.use(cors());
app.use(express.json());
app.use("/api", collectionRoutes);

app.listen(port, hostname, () => {
    console.log("Listening");
});


/*type WeatherData = {
    latitude: number;
    longitude: number;
    timezone: string;
    timezone_abbreviation: string;
    current: {
        time: string;
        interval: number;
        precipitation: number;
    };
};

app.get("/api/weather", async (req, res) => {
    console.log("GET /api/weather was called");
    try {
        const response = await fetch(
            "https://api.open-meteo.com/v1/forecast?latitude=40.7411&longitude=73.9897&current=precipitation&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=1"
        );
        const data = (await response.json()) as WeatherData;
        const output: WeatherResponse = {
            raining: data.current.precipitation > 0.5,
        };
        res.json(output);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.listen(port, hostname, () => {
    console.log("Listening");
});*/
