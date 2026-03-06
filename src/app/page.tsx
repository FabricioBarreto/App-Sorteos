"use client";

import { useState, useCallback } from "react";

export default function RegistroPage() {
  const [form, setForm] = useState({ name: "", dni: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    number?: number;
    name?: string;
    message?: string;
    alreadyRegistered?: boolean;
  } | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse.");
        return;
      }

      setResult(data);
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", dni: "", phone: "" });
    setResult(null);
    setError("");
  };

  const downloadComprobante = useCallback(() => {
    if (!result) return;

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;

    // Fondo degradado
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, "#1a1a2e");
    gradient.addColorStop(0.5, "#16213e");
    gradient.addColorStop(1, "#0f3460");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Borde decorativo
    ctx.strokeStyle = "#e91e63";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(15, 15, 570, 370, 20);
    ctx.stroke();

    // Línea decorativa interna
    ctx.strokeStyle = "rgba(233, 30, 99, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(25, 25, 550, 350, 16);
    ctx.stroke();

    // Título
    ctx.fillStyle = "#f48fb1";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🌸 Makallé - Sorteos Día de la Mujer 🌸", 300, 65);

    // Línea separadora
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, 85);
    ctx.lineTo(500, 85);
    ctx.stroke();

    // Texto "Tu número es"
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "16px sans-serif";
    ctx.fillText("Tu número es", 300, 120);

    // Número grande
    ctx.font = "bold 120px sans-serif";
    const numGradient = ctx.createLinearGradient(200, 130, 400, 250);
    numGradient.addColorStop(0, "#ffd54f");
    numGradient.addColorStop(1, "#ffb300");
    ctx.fillStyle = numGradient;
    ctx.fillText(`${result.number}`, 300, 240);

    // Nombre si existe
    if (result.name && result.name !== "Participante") {
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(result.name, 300, 285);
    }

    // DNI
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "14px monospace";
    const dniDisplay =
      form.dni || result.name === "Participante" ? form.dni : "";
    if (dniDisplay) {
      ctx.fillText(`DNI: ${dniDisplay}`, 300, 320);
    }

    // Mensaje inferior
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Presentá tu DNI para reclamar tu premio", 300, 360);

    // Descargar
    const link = document.createElement("a");
    link.download = `sorteo-makalle-${result.number}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [result, form.dni]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Partículas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor:
                i % 3 === 0 ? "#e91e63" : i % 3 === 1 ? "#ffd54f" : "#f48fb1",
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo placeholder */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-pink-500/30">
            <span className="text-4xl">🌸</span>
          </div>
          <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-pink-400 to-pink-200 bg-clip-text text-transparent">
            Makallé
          </h1>
          <p className="text-pink-300/80 mt-1 font-display text-lg">
            Sorteos Día de la Mujer
          </p>
        </div>

        {!result ? (
          <form
            onSubmit={handleSubmit}
            className="glass rounded-2xl p-6 space-y-5 animate-slide-up"
          >
            <h2 className="text-xl font-display font-semibold text-center text-white/90 mb-2">
              ¡Registrate y participá!
            </h2>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">
                DNI <span className="text-pink-400">*</span>
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                placeholder="Ej: 35456789"
                className="input-field text-center text-lg tracking-widest font-mono"
                value={form.dni}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dni: e.target.value.replace(/\D/g, "").slice(0, 8),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">
                Nombre <span className="text-white/30">(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: María García"
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">
                Telefono <span className="text-white/30">(opcional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ej: 3624123456"
                className="input-field"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 13),
                  })
                }
              />
              <p className="text-xs text-white/30 mt-1 ml-1">
                Para enterarte de próximos eventos
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Registrando...
                </span>
              ) : (
                "Participar del Sorteo 🎉"
              )}
            </button>

            <p className="text-xs text-white/40 text-center mt-3">
              Tus datos se usan únicamente para este sorteo.
            </p>
          </form>
        ) : (
          <div className="glass rounded-2xl p-8 text-center animate-bounce-in">
            <div className="text-6xl mb-4">
              {result.alreadyRegistered ? "ℹ️" : "🎉"}
            </div>

            <h2 className="font-display text-2xl font-bold text-white mb-2">
              {result.alreadyRegistered
                ? "¡Ya estás registrado/a!"
                : "¡Registro exitoso!"}
            </h2>

            {result.name && result.name !== "Participante" && (
              <p className="text-white/70 mb-4">{result.name}</p>
            )}

            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <p className="text-sm text-white/60 mb-2">Tu número es</p>
              <div className="font-display text-7xl font-black bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                {result.number}
              </div>
            </div>

            <button
              onClick={downloadComprobante}
              className="btn-accent w-full mb-4 flex items-center justify-center gap-2"
            >
              📥 Descargar comprobante
            </button>

            <p className="text-xs text-white/40 mb-6">
              Presentá tu DNI para reclamar tu premio
            </p>

            <button
              onClick={resetForm}
              className="text-pink-400 hover:text-pink-300 text-sm underline underline-offset-4 transition-colors"
            >
              Registrar otra persona
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
