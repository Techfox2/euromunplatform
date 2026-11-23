import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Prototype setup: no incremental cache store. Pages that need data render on
// request. Add an R2 or KV cache later if we need ISR or `use cache: remote`.
// See https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});
