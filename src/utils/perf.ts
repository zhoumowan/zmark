import { invoke } from "@tauri-apps/api/core";

export async function runIpcStressTest() {
  console.log(
    "%c[Performance] Starting IPC Stress Test...",
    "color: #2196F3; font-weight: bold;",
  );
  const iterations = 100;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await invoke("is_window_visible", { label: "main" });
    } catch (_e) {
      // ignore
    }
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);
  const min = times[0];
  const max = times[times.length - 1];
  const median = times[Math.floor(times.length / 2)];
  const p99 = times[Math.floor(times.length * 0.99)];

  const tti = window.__perf_tti ? `${window.__perf_tti.toFixed(2)} ms` : "N/A";

  let mem = "N/A";
  if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1048576).toFixed(2);
    const totalMB = (performance.memory.totalJSHeapSize / 1048576).toFixed(2);
    mem = `${usedMB} MB / ${totalMB} MB`;
  }

  const report = `[Performance Baseline Report]
1. TTI (Time to Interactive): ${tti}
2. Memory (JS Heap): ${mem}
3. IPC Latency (100 iterations):
   - Min: ${min.toFixed(2)} ms
   - Max: ${max.toFixed(2)} ms
   - Median: ${median.toFixed(2)} ms
   - P99: ${p99.toFixed(2)} ms
`;

  console.log(`%c${report}`, "color: #2196F3; font-weight: bold;");

  return { min, max, median, p99 };
}

// Make it available globally for easy triggering from DevTools console
window.runPerfTest = runIpcStressTest;
