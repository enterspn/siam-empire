import { TopNav } from "@/components/layout/top-nav";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/layout/logout-button";

const studentItems = [
  { href: "/dashboard", label: "หน้าหลัก" },
  { href: "/missions", label: "ภารกิจ" },
  { href: "/city-info", label: "ข้อมูลเมือง" },
  { href: "/trade", label: "ค้าขาย" },
  { href: "/war", label: "สงคราม" },
  { href: "/news", label: "ข่าวสาร" },
];

const ROLE_LABELS: Record<string, string> = {
  lord:        "👑 เจ้าเมือง",
  city_dept:   "📜 กรมเมือง",
  palace_dept: "🏛️ กรมวัง",
  chronicler:  "📖 คนสรุปเรื่องราว",
};

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
        <div>
          <p className="text-sm font-semibold text-crimson">{session.city_name}</p>
          {session.city_role && (
            <p className="text-xs text-ink/60">{ROLE_LABELS[session.city_role] ?? session.city_role}</p>
          )}
        </div>
        <LogoutButton />
      </div>
      <TopNav items={studentItems} />
      {children}
    </main>
  );
}
