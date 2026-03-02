"use client";

import { useState, useEffect, useCallback } from "react";

interface Participant {
  id: string;
  name: string;
  dni: string;
  phone: string;
  number: number;
  createdAt: string;
}

interface Raffle {
  id: string;
  winnerNumber: number;
  winnerName: string;
  winnerDni: string;
  prize: string;
  claimed: boolean;
  createdAt: string;
}

type Tab = "dashboard" | "sorteo" | "validar" | "historial";

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [tab, setTab] = useState<Tab>("dashboard");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [total, setTotal] = useState(0);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(false);

  // Sorteo
  const [prize, setPrize] = useState("");
  const [sorteoResult, setSorteoResult] = useState<any>(null);
  const [sorteoLoading, setSorteoLoading] = useState(false);

  // Validación
  const [validateDni, setValidateDni] = useState("");
  const [validateResult, setValidateResult] = useState<any>(null);
  const [validateLoading, setValidateLoading] = useState(false);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error);
        return;
      }

      setIsLoggedIn(true);
    } catch {
      setLoginError("Error de conexión.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsLoggedIn(false);
    setLoginForm({ username: "", password: "" });
  };

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/participants");
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      const data = await res.json();
      setParticipants(data.participants || []);
      setTotal(data.total || 0);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/history");
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      const data = await res.json();
      setRaffles(data.raffles || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchParticipants();
    fetchHistory();
    const interval = setInterval(() => {
      fetchParticipants();
    }, 10000); // Refresh cada 10s
    return () => clearInterval(interval);
  }, [isLoggedIn, fetchParticipants, fetchHistory]);

  const handleSorteo = async () => {
    if (
      !confirm("¿Lanzar el sorteo? Esto se mostrará en la pantalla del evento.")
    )
      return;

    setSorteoLoading(true);
    setSorteoResult(null);
    try {
      const res = await fetch("/api/admin/raffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prize: prize || "Premio" }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setSorteoResult(data.raffle);
      fetchHistory();
    } catch {
      alert("Error al ejecutar el sorteo.");
    } finally {
      setSorteoLoading(false);
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidateLoading(true);
    setValidateResult(null);
    try {
      const res = await fetch("/api/admin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dni: validateDni }),
      });
      const data = await res.json();
      setValidateResult(data);
    } catch {
      alert("Error al validar.");
    } finally {
      setValidateLoading(false);
    }
  };

  const filteredParticipants = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.dni.includes(searchTerm) ||
      p.number.toString() === searchTerm,
  );

  // LOGIN
  if (!isLoggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="glass rounded-2xl p-8 w-full max-w-sm space-y-5"
        >
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🔐</div>
            <h1 className="font-display text-2xl font-bold text-white">
              Admin
            </h1>
            <p className="text-white/50 text-sm">Panel de administración</p>
          </div>

          <input
            type="text"
            placeholder="Usuario"
            className="input-field"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="input-field"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
            required
          />

          {loginError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loginLoading}
          >
            {loginLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </main>
    );
  }

  // ADMIN PANEL
  return (
    <main className="min-h-screen p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Panel Admin
          </h1>
          <p className="text-white/50 text-sm">
            Makallé - Sorteos Día de la Mujer
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/50 hover:text-red-400 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-pink-400 font-display">
            {total}
          </p>
          <p className="text-xs text-white/50">Registrados</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400 font-display">
            {raffles.length}
          </p>
          <p className="text-xs text-white/50">Sorteos</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400 font-display">
            {raffles.filter((r) => r.claimed).length}
          </p>
          <p className="text-xs text-white/50">Premios entregados</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-400 font-display">
            {raffles.filter((r) => !r.claimed).length}
          </p>
          <p className="text-xs text-white/50">Sin reclamar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(
          [
            ["dashboard", "📋 Participantes"],
            ["sorteo", " Sortear"],
            ["validar", "✅ Validar"],
            ["historial", "📜 Historial"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === key
                ? "bg-pink-600 text-white shadow-lg shadow-pink-600/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB: Dashboard / Participantes */}
      {tab === "dashboard" && (
        <div className="glass rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Participantes
            </h2>
            <button
              onClick={fetchParticipants}
              className="text-sm text-pink-400 hover:text-pink-300"
            >
              🔄 Actualizar
            </button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre, DNI o número..."
            className="input-field mb-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {loading && participants.length === 0 ? (
            <p className="text-white/50 text-center py-8">Cargando...</p>
          ) : filteredParticipants.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              No hay participantes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/50 text-left border-b border-white/10">
                    <th className="pb-3 pr-4">N°</th>
                    <th className="pb-3 pr-4">Nombre</th>
                    <th className="pb-3 pr-4">DNI</th>
                    <th className="pb-3 pr-4"></th>
                    <th className="pb-3">Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="py-3 pr-4">
                        <span className="bg-pink-600/30 text-pink-300 px-2 py-0.5 rounded-lg font-bold text-xs">
                          {p.number}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-white/90">{p.name}</td>
                      <td className="py-3 pr-4 text-white/60 font-mono text-xs">
                        {p.dni}
                      </td>
                      <td className="py-3 pr-4 text-white/60 font-mono text-xs">
                        {p.phone}
                      </td>
                      <td className="py-3 text-white/40 text-xs">
                        {new Date(p.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Sorteo */}
      {tab === "sorteo" && (
        <div className="glass rounded-2xl p-6 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4"></div>
          <h2 className="font-display text-2xl font-bold text-white mb-2">
            Lanzar Sorteo
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Esto activará la cuenta regresiva en la pantalla del evento.
          </p>

          <input
            type="text"
            placeholder="Nombre del premio (opcional)"
            className="input-field mb-6"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
          />

          <p className="text-white/40 text-xs mb-4">
            Participantes disponibles: {total - raffles.length} de {total}
          </p>

          <button
            onClick={handleSorteo}
            disabled={sorteoLoading || total === 0}
            className="btn-accent w-full text-lg disabled:opacity-50"
          >
            {sorteoLoading ? "Sorteando..." : "🎲 ¡SORTEAR AHORA!"}
          </button>

          {sorteoResult && (
            <div className="mt-6 bg-green-500/20 border border-green-500/30 rounded-xl p-4 animate-fade-in">
              <p className="text-green-300 font-semibold">¡Sorteo realizado!</p>
              <p className="text-4xl font-display font-black text-yellow-400 my-2">
                N° {sorteoResult.winnerNumber}
              </p>
              <p className="text-white/70">{sorteoResult.winnerName}</p>
              <p className="text-white/50 text-sm mt-1">{sorteoResult.prize}</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-white/40 text-xs">
              💡 Abrí <span className="text-pink-400">/sorteo</span> en la
              pantalla grande del evento antes de sortear.
            </p>
          </div>
        </div>
      )}

      {/* TAB: Validar */}
      {tab === "validar" && (
        <div className="glass rounded-2xl p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">✅</div>
            <h2 className="font-display text-2xl font-bold text-white">
              Validar Ganador
            </h2>
            <p className="text-white/50 text-sm">
              Ingresá el DNI para confirmar.
            </p>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              placeholder="DNI del ganador"
              className="input-field text-center text-2xl font-mono tracking-widest"
              value={validateDni}
              onChange={(e) =>
                setValidateDni(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              required
            />
            <button
              type="submit"
              disabled={validateLoading}
              className="btn-primary w-full"
            >
              {validateLoading ? "Verificando..." : "Verificar DNI"}
            </button>
          </form>

          {validateResult && (
            <div
              className={`mt-6 rounded-xl p-4 animate-fade-in ${
                validateResult.valid
                  ? "bg-green-500/20 border border-green-500/30"
                  : "bg-red-500/20 border border-red-500/30"
              }`}
            >
              <p
                className={`font-semibold text-lg ${
                  validateResult.valid ? "text-green-300" : "text-red-300"
                }`}
              >
                {validateResult.valid
                  ? "✅ ¡GANADOR CONFIRMADO!"
                  : "❌ No es ganador"}
              </p>
              <p className="text-white/70 mt-2">{validateResult.message}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Historial */}
      {tab === "historial" && (
        <div className="glass rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-white">
              Historial de Sorteos
            </h2>
            <button
              onClick={fetchHistory}
              className="text-sm text-pink-400 hover:text-pink-300"
            >
              🔄 Actualizar
            </button>
          </div>

          {raffles.length === 0 ? (
            <p className="text-white/50 text-center py-8">
              No se realizaron sorteos aún.
            </p>
          ) : (
            <div className="space-y-3">
              {raffles.map((r, i) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between bg-white/5 rounded-xl p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl font-bold text-yellow-400">
                      N° {r.winnerNumber}
                    </span>
                    <div>
                      <p className="text-white/90 font-medium">
                        {r.winnerName}
                      </p>
                      <p className="text-white/40 text-xs">
                        {r.prize} ·{" "}
                        {new Date(r.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      r.claimed
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {r.claimed ? "Entregado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
