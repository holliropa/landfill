import express from "express";
import cors from "cors";
import fileRoutes from "@/routes/file.routes";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/files", fileRoutes);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
