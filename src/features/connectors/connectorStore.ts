import { create } from "zustand";
import { pinterestStatus, type ConnectorStatus } from "../../tauri/commands";

interface ConnectorState {
  pinterest: ConnectorStatus;
  refresh: () => Promise<void>;
}

export const useConnectors = create<ConnectorState>((set) => ({
  pinterest: { configured: false, connected: false, username: null },
  refresh: async () => {
    try {
      set({ pinterest: await pinterestStatus() });
    } catch {
      // Backend without connector support; keep defaults.
    }
  },
}));
