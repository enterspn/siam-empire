import { TopNav } from "@/components/layout/top-nav";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";

const studentItems = [
  { href: "/dashboard", label: "หน้าหลัก" },
  { href: "/city-info", label: "ข้อมูลเมือง" },
  { href: "/laws", label: "กฎหมาย" },
  { href: "/trade", label: "ค้าขาย" },
  { href: "/envoy", label: "ทูต" },
  { href: "/war", label: "สงคราม" },
  { href: "/news", label: "ข่าวสาร" },
];

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="siam-shell">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-crimson">
          {session.city_name}
        </p>
        <LogoutButton />
      </div>
      <TopNav items={studentItems} />
      {children}
    </main>
  );
}
