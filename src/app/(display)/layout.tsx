import { Sidebar } from "@/components/layout/sidebar";

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
