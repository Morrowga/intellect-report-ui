import { Sidebar } from "@/components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="ml-56 min-h-screen p-8">
        {children}
      </main>
    </>
  );
}