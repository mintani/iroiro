import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

/**
 * The deployed app: one Worker built by OpenNext, serving the prerendered
 * page and the static assets. `name` pins the Worker script name, so the
 * URL stays `https://iroiro.<account-subdomain>.workers.dev` across stages.
 */
export const Website = Cloudflare.Website.Nextjs("Website", {
  name: "iroiro",
  // Hash only the files the build reads, so an unchanged source tree skips
  // the OpenNext build and the deploy.
  memo: {
    include: [
      "src/**",
      "public/**",
      "package.json",
      "bun.lock",
      "next.config.ts",
      "postcss.config.mjs",
      "open-next.config.ts",
      "tsconfig.json",
    ],
  },
});

export default Alchemy.Stack(
  "iroiro",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const site = yield* Website;
    return { url: site.url };
  })
);
