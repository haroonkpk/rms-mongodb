"use client";

import Ably from "ably";

type DataChangedHandler = (payload: { scope: string }) => void;
type ConnectionHandler = () => void;

type Handler = DataChangedHandler | ConnectionHandler;

class RestaurantRealtime {
  private readonly client = new Ably.Realtime({
    authUrl: "/api/ably/token",
    authMethod: "POST",
    autoConnect: false,
  });
  private readonly channel = this.client.channels.get("restaurant");
  private readonly handlers = new Map<string, Set<Handler>>();
  private subscribed = false;

  constructor() {
    this.client.connection.on("connected", () => this.emit("connect"));
    this.client.connection.on("disconnected", () => this.emit("disconnect"));
    this.client.connection.on("failed", () => this.emit("disconnect"));
  }

  on(event: "connect" | "disconnect", handler: ConnectionHandler): void;
  on(event: "restaurant:data-changed", handler: DataChangedHandler): void;
  on(event: string, handler: Handler) {
    const eventHandlers = this.handlers.get(event) ?? new Set<Handler>();
    eventHandlers.add(handler);
    this.handlers.set(event, eventHandlers);
  }

  off(event: string, handler?: Handler) {
    if (!handler) {
      this.handlers.delete(event);
      return;
    }
    this.handlers.get(event)?.delete(handler);
  }

  connect() {
    if (!this.subscribed) {
      this.subscribed = true;
      void this.channel
        .subscribe("restaurant:data-changed", (message) => {
          this.emit(
            "restaurant:data-changed",
            message.data as { scope: string },
          );
        })
        .catch((error: unknown) => {
          this.subscribed = false;
          console.error("Ably subscribe error:", error);
        });
    }
    this.client.connect();
    if (this.client.connection.state === "connected") {
      this.emit("connect");
    }
  }

  disconnect() {
    try {
      this.channel.unsubscribe();
      this.subscribed = false;
    } catch (error) {
      console.warn("Ably unsubscribe failed:", error);
    }
  }

  private emit(event: string, payload?: { scope: string }) {
    this.handlers.get(event)?.forEach((handler) => {
      if (event === "restaurant:data-changed") {
        (handler as DataChangedHandler)(payload as { scope: string });
      } else {
        (handler as ConnectionHandler)();
      }
    });
  }
}

declare global {
  interface Window {
    __restaurantSocket?: RestaurantRealtime;
  }
}

export function getSocketClient(): RestaurantRealtime | null {
  if (typeof window === "undefined") return null;

  if (!window.__restaurantSocket) {
    window.__restaurantSocket = new RestaurantRealtime();
  }

  return window.__restaurantSocket;
}
