import { ref, shallowRef } from "vue";
import { ApiError, ERROR_MESSAGES, scanRepo } from "../api/client";
import type { ScanRequest, ScanResult } from "../api/types";
import { loadHistory, saveToHistory } from "../lib/history";
import type { HistoryEntry } from "../lib/history";

export type ScanStatus = "idle" | "loading" | "error" | "success";

export function useScan() {
  const status = ref<ScanStatus>("idle");
  const result = shallowRef<ScanResult | null>(null);
  const errorMessage = ref<string>("");
  const errorCode = ref<string>("");
  const lastRequest = shallowRef<ScanRequest | null>(null);
  const history = shallowRef<HistoryEntry[]>(loadHistory());
  let controller: AbortController | null = null;

  async function run(req: ScanRequest): Promise<void> {
    controller?.abort();
    controller = new AbortController();
    const mine = controller;
    lastRequest.value = req;
    status.value = "loading";
    errorMessage.value = "";
    errorCode.value = "";
    try {
      const data = await scanRepo(req, { signal: mine.signal });
      if (mine !== controller) return;
      result.value = data;
      history.value = saveToHistory(data);
      status.value = "success";
    } catch (err) {
      if (mine !== controller) return;
      if (err instanceof ApiError) {
        errorCode.value = err.code;
        errorMessage.value = err.message;
      } else {
        errorCode.value = "UNKNOWN";
        errorMessage.value = ERROR_MESSAGES.UNKNOWN;
      }
      status.value = "error";
    }
  }

  function retry(): Promise<void> | undefined {
    return lastRequest.value ? run(lastRequest.value) : undefined;
  }

  function show(saved: ScanResult): void {
    controller?.abort();
    controller = null;
    result.value = saved;
    status.value = "success";
  }

  return { status, result, errorMessage, errorCode, lastRequest, history, run, retry, show };
}
