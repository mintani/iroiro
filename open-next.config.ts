import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  // Every route is prerendered at build time, so the cache only ever reads
  // the payloads shipped with the static assets. No KV or R2 needed.
  incrementalCache: staticAssetsIncrementalCache,
});
