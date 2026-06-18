declare global {
  class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
  }
  interface Window {
    newwebRender?: (md: string) => string;
    newweb: {
      redirect: (url: string, reason?: string) => void;
      replace: (url: string) => void;
      info: (md: string) => void;
      error: (md: string) => void;
      more: (md: string) => void;
      load:  (url: string, data: Record<string, unknown>) => void;
      store: (key: string, value: string) => void;
      get:   (key: string) => string;
      auth:     (success: boolean, passwordHash: string, username: string) => void;
      apiFetch: (method: string, url: string, body: string) => void;
    };
  }
}

export type Modal = HTMLDialogElement & { onCancel?: () => void };

export type FieldDef = {
  key: string;
  label: string;
  type: string;
  maxlength: number | null;
  options: string[] | null;
};
