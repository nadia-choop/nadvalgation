import express, { Express } from "express";
import cors from "cors";
import collectionRoutes from "./routes/collections";
import placesRoutes from "./routes/places";

const app: Express = express();

const hostname = "0.0.0.0";
const port = 8080;

app.use(cors());
app.use(express.json());
app.use("/api", collectionRoutes);
app.use("/api", placesRoutes);

app.listen(port, hostname, () => {
    console.log("Listening");
});
