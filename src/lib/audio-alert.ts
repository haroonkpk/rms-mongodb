"use client";



let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx || audioCtx.state === "closed") {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

export function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }
}

function playToneSequence(ctx: AudioContext) {
  try {
    const now = ctx.currentTime;

    // Tone 1 (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2 (B5 - 987.77 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, now + 0.14);
    gain2.gain.setValueAtTime(0.45, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.75);
  } catch (err) {
    console.warn("Audio chime tone sequence error:", err);
  }
}

export function playAudioChime() {
  const ctx = getAudioContext();
  if (ctx) {
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playToneSequence(ctx)).catch(() => playToneSequence(ctx));
    } else {
      playToneSequence(ctx);
    }
  }
}

/**
 * Triggers notification when a NEW order arrives in the Kitchen (POS -> Kitchen)
 */
export function playKitchenNotification(kotNumber?: string | number) {
  playAudioChime();

  if (
    kotNumber &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(`Kitchen KOT #${kotNumber}`, {
        body: `New order KOT #${kotNumber} received for preparation!`,
        tag: `kitchen-kot-${kotNumber}`,
      });
    } catch {
      // Ignore notification errors
    }
  }
}

/**
 * Triggers notification when Kitchen marks an order READY for POS/Serving staff (Kitchen -> POS)
 */
export function playPOSReadyNotification(kotNumber?: string | number) {
  playAudioChime();

  if (
    kotNumber &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(`POS KOT #${kotNumber} Ready`, {
        body: `KOT #${kotNumber} is prepared and ready to serve!`,
        tag: `pos-kot-${kotNumber}`,
      });
    } catch {
      // Ignore notification errors
    }
  }
}

// Alias for backwards compatibility
export const playKitchenChime = playKitchenNotification;
