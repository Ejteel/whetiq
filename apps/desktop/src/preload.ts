// Replace with contextBridge exposure when Electron runtime is wired.
export interface DesktopApi {
  version: string;
}

export const desktopApi: DesktopApi = {
  version: "0.1.0"
};
