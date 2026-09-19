import { createServer } from "node:http";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);

async function startServer() {
  const app = next({ dev, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  const httpServer = createServer((request, response) =>
    handle(request, response),
  );
  httpServer.listen(port, () => {
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
