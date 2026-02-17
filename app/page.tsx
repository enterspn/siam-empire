import Link from "next/link";

export default function HomePage() {
  return (
    <main className="siam-shell">
      <section className="siam-card text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
          เกมจำลองอาณาจักร
        </p>
        <h1 className="siam-title text-3xl">Siam Empire</h1>
        <p className="mt-3 text-sm text-ink/80">
          จำลองอาณาจักรไทยโบราณ เรียนรู้ประวัติศาสตร์แบบร่วมมือ
        </p>

        <div className="mt-5 grid gap-2">
          <Link href="/login" className="siam-button text-center">
            เข้าสู่เกม
          </Link>
          <Link
            href="/admin"
            className="rounded-xl border border-crimson px-4 py-2 text-center font-semibold text-crimson"
          >
            แผงควบคุมครู
          </Link>
        </div>
      </section>
    </main>
  );
}
