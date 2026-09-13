import { REPO_URL } from "@/components/site/site-header";

export const SiteFooter = () => (
  <footer className="border-t">
    <div className="mx-auto w-full max-w-5xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
      <p>
        iroiro — MIT licensed, no upload, no account.{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-border underline-offset-4 hover:decoration-current"
        >
          Source on GitHub
        </a>
        .
      </p>
    </div>
  </footer>
);
