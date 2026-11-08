import { ref, watch, type WatchSource } from 'vue';

// Most filter changes on the dashboards recompute derived data from an
// already-fetched array synchronously — too fast for a loading indicator to
// ever actually be seen. This fakes a deliberate minimum-visible duration
// instead of wiring a real async boundary that doesn't otherwise exist, so
// the watery loading overlay gets a chance to animate and confirm the
// filter change registered. Rapid consecutive changes (e.g. dragging a
// slider) restart the timer rather than flicker the overlay on/off.
export function useBriefLoading(sources: WatchSource<unknown>[], minDurationMs = 450) {
  const loading = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  // deep: true so a source whose ref wraps an array/object (e.g. the map's
  // mapLayers list, mutated in place per-layer rather than reassigned) still
  // triggers this — a shallow watch only fires on `.value` reassignment.
  watch(
    sources,
    () => {
      loading.value = true;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        loading.value = false;
        timer = null;
      }, minDurationMs);
    },
    { deep: true },
  );

  return loading;
}
