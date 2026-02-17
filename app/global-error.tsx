"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body style={{ margin: 0, background: "#fdf5e6", fontFamily: "sans-serif", padding: 24 }}>
        <main style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
          <p style={{ color: "#92400e", fontWeight: 600 }}>เกิดข้อผิดพลาดในระบบ</p>
          <p style={{ color: "#57534e", fontSize: 14, marginBottom: 16 }}>
            {error?.message || "กรุณารีเฟรชหรือกลับหน้าหลัก"}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#b45309",
              color: "#fff",
              border: "none",
              padding: "10px 16px",
              borderRadius: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            ลองอีกครั้ง
          </button>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginLeft: 8,
              padding: "10px 16px",
              border: "1px solid #b45309",
              color: "#92400e",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            กลับหน้าหลัก
          </a>
        </main>
      </body>
    </html>
  );
}
