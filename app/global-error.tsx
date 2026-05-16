"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          background: "#fafaf9",
          color: "#1c1917",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "32rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>
            Ups, ada masalah
          </h2>
          <p
            style={{
              marginTop: "0.75rem",
              color: "#78716c",
              fontSize: "0.95rem",
            }}
          >
            Halaman ini gak bisa di-load. Coba refresh atau kembali ke
            halaman sebelumnya.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.625rem",
              border: "none",
              background: "#059669",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
