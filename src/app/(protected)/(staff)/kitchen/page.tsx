"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { getKitchenOrders } from "@/actions/kitchen";
import { KitchenOrder, KitchenStats, OrderStatus } from "@/types";
import { getSocketClient } from "@/lib/socket-client";
import {
  playKitchenNotification,
  requestNotificationPermission,
} from "@/lib/audio-alert";
import { KitchenHeader } from "@/components/kitchen/kitchen-header";
import { KitchenOrderCard } from "@/components/kitchen/kitchen-order-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function KitchenPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [stats, setStats] = useState<KitchenStats>({
    totalActive: 0,
    pendingCount: 0,
    preparingCount: 0,
    readyCount: 0,
    completedTodayCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL_ACTIVE");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "connecting" | "polling" | "disconnected"
  >("connecting");

  // Track sound enabled state in Ref to avoid stale closures
  const isSoundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // Track known order IDs to detect newly arrived orders
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Load sound preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kds_sound_enabled");
      if (saved !== null) {
        const val = saved === "true";
        setIsSoundEnabled(val);
        isSoundEnabledRef.current = val;
      }
    } catch {
      // Ignore
    }

    requestNotificationPermission();
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      isSoundEnabledRef.current = next;
      try {
        localStorage.setItem("kds_sound_enabled", String(next));
      } catch {
        // Ignore
      }
      if (next) {
        requestNotificationPermission();
        playKitchenNotification();
        toast.success("Kitchen Sound alerts enabled", { icon: null });
      } else {
        toast("Kitchen Sound alerts muted", { icon: null });
      }
      return next;
    });
  }, []);

  // Core Order Fetcher & New Order Detector
  const fetchOrders = useCallback(async () => {
    try {
      const res = await getKitchenOrders();
      if (res.success && res.orders) {
        const fetchedOrders = res.orders;

        // Detect new incoming orders
        if (initialLoadDoneRef.current) {
          const newOrders = fetchedOrders.filter(
            (o) =>
              !knownOrderIdsRef.current.has(o.id) && o.status === "PENDING",
          );

          if (newOrders.length > 0) {
            const firstNewOrder = newOrders[0];
            const displayKot = firstNewOrder.kotNumber
              ? String(firstNewOrder.kotNumber)
              : firstNewOrder.orderNumber;

            if (isSoundEnabledRef.current) {
              playKitchenNotification(displayKot);
            }

            toast.success(`New Order KOT #${displayKot} Received in Kitchen!`, {
              duration: 6000,
              icon: null,
            });
          }
        }

        // Update known order IDs set
        fetchedOrders.forEach((o) => knownOrderIdsRef.current.add(o.id));
        initialLoadDoneRef.current = true;

        setOrders(fetchedOrders);
        setStats(res.stats);
      } else if (res.error) {
        toast.error(res.error, { icon: null });
      }
    } catch (err) {
      console.error("[KitchenPage] Error fetching orders:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription setup
  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) {
      setRealtimeStatus("polling");
      return;
    }

    setRealtimeStatus("connecting");
    const handleDataChanged = ({ scope }: { scope: string }) => {
      if (scope === "orders") {
        if (isSoundEnabledRef.current) playKitchenNotification();
        toast.success("New Order Added in Kitchen!", { icon: null });
        fetchOrders();
      }
    };
    socket.on("connect", () => setRealtimeStatus("connected"));
    socket.on("disconnect", () => setRealtimeStatus("polling"));
    socket.on("restaurant:data-changed", handleDataChanged);
    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("restaurant:data-changed", handleDataChanged);
      socket.disconnect();
    };
  }, [fetchOrders]);

  // Fallback polling is active when realtime is not connected.
  useEffect(() => {
    if (realtimeStatus === "connected") {
      return;
    }

    const interval = setInterval(() => {
      fetchOrders();
    }, 100000);

    return () => clearInterval(interval);
  }, [realtimeStatus, fetchOrders]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = useCallback(
    (orderId: string, newStatus: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
      fetchOrders();
    },
    [fetchOrders],
  );

  // Status-only filtered orders computation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter === "ALL_ACTIVE") {
        return ["PENDING", "PREPARING", "READY"].includes(order.status);
      }
      if (statusFilter !== "ALL") {
        return order.status === statusFilter;
      }
      return true;
    });
  }, [orders, statusFilter]);

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      {/* Header with Control Ribbon */}
      <KitchenHeader
        stats={stats}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        realtimeStatus={realtimeStatus}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* Main KDS Tickets Grid */}
      <main>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[clamp(1rem,2vw,1.5rem)]">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <Card
                key={idx}
                variant="white"
                className="h-64 border border-slate-200 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-12 bg-slate-100 rounded w-full mt-4" />
                </div>
                <div className="h-10 bg-slate-200 rounded w-full" />
              </Card>
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[clamp(1rem,2vw,1.5rem)]">
            {filteredOrders.map((order) => (
              <KitchenOrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <Card
            variant="white"
            className="bg-transparent! py-[clamp(2.5rem,5vw,4rem)] text-center max-w-lg mx-auto "
          >
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-[clamp(1.1rem,1.5vw,1.25rem)] font-extrabold text-slate-900">
                No Kitchen Tickets Found
              </h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                {statusFilter !== "ALL_ACTIVE"
                  ? "No kitchen orders matched the selected status filter."
                  : "All caught up! There are currently no active orders waiting in the kitchen queue."}
              </p>
              {statusFilter !== "ALL_ACTIVE" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStatusFilter("ALL_ACTIVE")}
                  className="mt-4 !px-4 !py-2 text-xs"
                >
                  Show All Active Orders
                </Button>
              )}
              <Button
                type="button"
                variant="primary"
                onClick={handleManualRefresh}
                icon={<RefreshCw size={14} />}
                className="mt-3 !px-4 !py-2 text-xs"
              >
                Check New Orders
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
