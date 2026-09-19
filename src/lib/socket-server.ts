import type { Server } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var restaurantSocket: Server | undefined;
}

export function setSocketServer(server: Server) {
  globalThis.restaurantSocket = server;
}

export function emitDataChanged(scope: string) {
  globalThis.restaurantSocket?.emit("restaurant:data-changed", { scope });
}
