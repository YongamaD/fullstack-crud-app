import "dotenv/config";
import { buildServer } from "./server";
import { config } from "./config";

const app = buildServer();

const start = async () => {
  try {
    await app.listen({ port: config.PORT, host: config.HOST });
    console.log(`API running on http://localhost:${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
