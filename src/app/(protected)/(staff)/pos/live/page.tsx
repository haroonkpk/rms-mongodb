"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { getKitchenOrders } from "@/actions/kitchen";
import { getKotSequence, resetKotSequence } from "@/actions/pos";
import { KitchenOrder, KitchenStats, OrderStatus } from "@/types";
import { getSupabaseClient } from "@/lib/supabase-client";
import {
  playPOSReadyNotification,
  requestNotificationPermission,
} from "@/lib/audio-alert";
import { PosLiveHeader } from "@/components/pos/pos-live-header";
import { PosLiveOrderCard } from "@/components/pos/pos-live-order-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function PosLivePage() {
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
  const [statusFilter, setStatusFilter] = useState("READY");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connected" | "connecting" | "polling" | "disconnected"
  >("connecting");
  const [currentKotNumber, setCurrentKotNumber] = useState(0);
  const [kotWindowStartedAt, setKotWindowStartedAt] = useState<string | null>(
    null,
  );
  const [isResettingKot, setIsResettingKot] = useState(false);

  const isSoundEnabledRef = useRef(isSoundEnabled);
  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  const knownReadyOrdersRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);

  // Load sound preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("pos_live_sound_enabled");
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
        localStorage.setItem("pos_live_sound_enabled", String(next));
      } catch {
        // Ignore
      }
      if (next) {
        requestNotificationPermission();
        playPOSReadyNotification();
        toast.success("POS Sound alerts enabled", { icon: null });
      } else {
        toast("POS Sound alerts muted", { icon: null });
      }
      return next;
    });
  }, []);

  // Core Order Fetcher
  const fetchOrders = useCallback(async () => {
    try {
      const [res, sequence] = await Promise.all([
        getKitchenOrders(),
        getKotSequence(),
      ]);
      if (res.success && res.orders) {
        const fetchedOrders = res.orders;

        // Detect newly ready orders for audio alert
        if (initialLoadDoneRef.current) {
          const newlyReady = fetchedOrders.filter(
            (o) =>
              o.status === "READY" && !knownReadyOrdersRef.current.has(o.id),
          );

          if (newlyReady.length > 0) {
            const firstReady = newlyReady[0];
            const displayOrderNum = firstReady.kotNumber
              ? String(firstReady.kotNumber)
              : firstReady.orderNumber;

            if (isSoundEnabledRef.current) {
              playPOSReadyNotification(displayOrderNum);
            }
            toast.success(`KOT #${displayOrderNum} is READY to serve!`, {
              duration: 6000,
              icon: null,
            });
          }
        }

        // Update known ready order IDs set
        fetchedOrders.forEach((o) => {
          if (o.status === "READY") {
            knownReadyOrdersRef.current.add(o.id);
          }
        });
        initialLoadDoneRef.current = true;

        setOrders(fetchedOrders);
        setStats(res.stats);
        setCurrentKotNumber(sequence.currentNumber);
        setKotWindowStartedAt(sequence.windowStartedAt);
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (err) {
      console.error("[PosLivePage] Error fetching orders:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Supabase Realtime Subscription Setup
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setRealtimeStatus("polling");
      return;
    }

    setRealtimeStatus("connecting");

    const channel = supabase
      .channel("realtime-pos-live-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setRealtimeStatus("polling");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Fallback Polling
  useEffect(() => {
    if (realtimeStatus === "connected") {
      return;
    }

    const interval = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(interval);
  }, [realtimeStatus, fetchOrders]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const handleResetKot = useCallback(async () => {
    setIsResettingKot(true);
    try {
      await resetKotSequence();
      setCurrentKotNumber(0);
      setKotWindowStartedAt(new Date().toISOString());
      toast.success("KOT sequence reset. Next order will be KOT #1.", {
        icon: null,
      });
      await fetchOrders();
    } catch {
      toast.error("Unable to reset KOT sequence.");
    } finally {
      setIsResettingKot(false);
    }
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

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    const list = orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter === "PENDING") {
        if (order.status !== "PENDING") return false;
      } else if (statusFilter === "READY") {
        if (order.status !== "READY") return false;
      } else if (statusFilter === "COMPLETED") {
        if (order.status !== "COMPLETED") return false;
      } else {
        if (!["READY", "COMPLETED"].includes(order.status)) return false;
      }

      return true;
    });

    if (statusFilter === "COMPLETED") {
      return [...list].sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA; // Latest completed order first!
      });
    }

    return list;
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      {/* Header with Controls & Search */}
      <PosLiveHeader
        stats={stats}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        realtimeStatus={realtimeStatus}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        currentKotNumber={currentKotNumber}
        kotWindowStartedAt={kotWindowStartedAt}
        onResetKot={handleResetKot}
        isResettingKot={isResettingKot}
      />

      {/* Main Live Orders Grid */}
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
              <PosLiveOrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <Card
            variant="white"
            className="bg-transparent! py-[clamp(2.5rem,5vw,4rem)] text-center max-w-lg mx-auto"
          >
            <div className="flex flex-col items-center justify-center">
              <h3 className="text-[clamp(1.1rem,1.5vw,1.25rem)] font-extrabold text-slate-900">
                No Orders Found
              </h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm">
                {searchQuery
                  ? `No live orders matching "${searchQuery}".`
                  : statusFilter === "READY"
                    ? "There are currently no orders ready to be served."
                    : "No completed orders recorded today."}
              </p>

              {(statusFilter !== "READY" || searchQuery) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStatusFilter("READY");
                    setSearchQuery("");
                  }}
                  className="mt-4 !px-4 !py-2 text-xs font-bold"
                >
                  Clear Filters
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                onClick={handleManualRefresh}
                icon={<RefreshCw size={14} />}
                className="mt-3 !px-4 !py-2 text-xs font-bold"
              >
                Refresh Orders
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
