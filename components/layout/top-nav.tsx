import Link from "next/link";

type NavItem = {
  href: string;
  label: string;
};

type TopNavProps = {
  items: NavItem[];
};

export function TopNav({ items }: TopNavProps) {
  return (
    <nav className="siam-card mb-4 flex flex-wrap gap-2 p-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg border border-gold/40 bg-parchment px-3 py-1.5 text-sm font-semibold text-crimson"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
