/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GITHUB_CLIENT_ID?: string;
  readonly VITE_SILICONFLOW_API_KEY?: string;
}

declare module "canvas-nest.js" {
  export interface CanvasNestConfig {
    color?: string;
    opacity?: number;
    count?: number;
    zIndex?: number;
    [key: string]: unknown;
  }

  export interface CanvasNestInstance {
    destroy?: () => void;
    points?: Array<{
      xa?: number;
      ya?: number;
    }>;
  }

  const CanvasNest: new (
    el: HTMLElement,
    config?: CanvasNestConfig,
  ) => CanvasNestInstance;
  export default CanvasNest;
}
