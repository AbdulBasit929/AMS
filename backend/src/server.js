import app from "./app.js";
import { ensureAuditStorage, ensureBootstrapAdmin, ensureFingerprintStorage } from "./services/bootstrapService.js";

const port = Number(process.env.PORT || 4000);

async function start() {
  await ensureAuditStorage();
  await ensureFingerprintStorage();
  await ensureBootstrapAdmin();

  app.listen(port, () => {
    console.log(`attendance-backend listening on http://127.0.0.1:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start attendance-backend:", error);
  process.exit(1);
});
