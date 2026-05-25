import { initDb } from "@landfill/db";

export * from "@landfill/db/schema";
import config from "@/config";

export default initDb(config.database.path);
