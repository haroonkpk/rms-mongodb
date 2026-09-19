"use client";

import { io, type Socket } from "socket.io-client";

type RestaurantSocket = Socket<
  { "restaurant:data-changed": (payload: { scope: string }) => void },
  Record<string, never>
>;

declare global {
  interface Window {
    __restaurantSocket?: RestaurantSocket;
  }
}

export function getSocketClient(): RestaurantSocket | null {
  if (typeof window === "undefined") return null;

  if (!window.__restaurantSocket) {
    window.__restaurantSocket = io({
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }

  return window.__restaurantSocket;
}
