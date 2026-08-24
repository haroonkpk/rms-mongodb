import { Header } from "@/components/layouts";

export default function AdminEmployeesPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Employee & Staff Management" />
      {/* Main Layout */}
      <main className="flex flex-col-reverse md:flex-row gap-8">
        {/* ── LEFT ── */}
        <div className=" w-full max-w-3xl flex flex-col gap-4">hello</div>

        {/*  RIGHT Side */}
        <div className="lg:col-span-4">heloo</div>
      </main>
    </div>
  );
}
