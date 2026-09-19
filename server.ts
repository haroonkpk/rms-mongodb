import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { setSocketServer } from "./src/lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.SERVER_HOST || "0.0.0.0";
const publicUrl =
  process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
const port = Number(process.env.PORT || 3000);

async function startServer() {
  const app = next({ dev, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();
  const httpServer = createServer((request, response) =>
    handle(request, response),
  );
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
  });

  setSocketServer(io);
  io.on("connection", (socket) => {
    socket.emit("restaurant:data-changed", { scope: "connected" });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Ready on ${publicUrl}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exitCode = 1;
});
