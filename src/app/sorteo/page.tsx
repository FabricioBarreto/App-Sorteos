"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Confetti simple sin dependencia externa
function launchConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = [
    "#e91e63",
    "#ffd54f",
    "#f48fb1",
    "#ff5722",
    "#4caf50",
    "#2196f3",
    "#9c27b0",
    "#ff9800",
    "#ffffff",
  ];
  const pieces: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    gravity: number;
  }> = [];

  // Crear piezas de confeti
  for (let i = 0; i < 300; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      w: Math.random() * 12 + 4,
      h: Math.random() * 8 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 30,
      vy: Math.random() * -25 - 10,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 15,
      gravity: 0.3 + Math.random() * 0.2,
    });
  }

  let frame = 0;
  const maxFrames = 300;

  function animate() {
    if (frame > maxFrames) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of pieces) {
      p.x += p.vx;
      p.vy += p.gravity;
      p.y += p.vy;
      p.vx *= 0.99;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    frame++;
    requestAnimationFrame(animate);
  }

  animate();
}

type SorteoState = "waiting" | "countdown" | "reveal" | "winner";

export default function SorteoPage() {
  const [state, setState] = useState<SorteoState>("waiting");
  const [countdown, setCountdown] = useState(3);
  const [winnerNumber, setWinnerNumber] = useState<number | null>(null);
  const [rollingNumber, setRollingNumber] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Polling para detectar cuando el admin lanza un sorteo
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/sorteo/status");
      const data = await res.json();

      if (
        data.state === "countdown" &&
        data.winnerNumber &&
        state === "waiting"
      ) {
        setWinnerNumber(data.winnerNumber);
        setState("countdown");

        // Reset status en el servidor
        fetch("/api/sorteo/status", { method: "POST" });
      }
    } catch {
      // Silenciar errores de conexión
    }
  }, [state]);

  useEffect(() => {
    pollingRef.current = setInterval(checkStatus, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [checkStatus]);

  // Cuenta regresiva
  useEffect(() => {
    if (state !== "countdown") return;

    if (countdown <= 0) {
      setState("reveal");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [state, countdown]);

  // Efecto de números girando
  useEffect(() => {
    if (state !== "reveal") return;

    let frame = 0;
    const totalFrames = 40; // ~2 segundos a 20fps
    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(interval);
        setState("winner");
        return;
      }

      // Los números giran más lento hacia el final
      if (frame < totalFrames - 5) {
        setRollingNumber(Math.floor(Math.random() * 999) + 1);
      } else {
        setRollingNumber(winnerNumber!);
      }
      frame++;
    }, 50);

    return () => clearInterval(interval);
  }, [state, winnerNumber]);

  // Confeti cuando se revela el ganador
  useEffect(() => {
    if (state !== "winner" || !canvasRef.current) return;

    launchConfetti(canvasRef.current);

    // Segundo lanzamiento con delay
    const timer = setTimeout(() => {
      if (canvasRef.current) launchConfetti(canvasRef.current);
    }, 1500);

    return () => clearTimeout(timer);
  }, [state]);

  // Reset para nuevo sorteo
  const resetSorteo = () => {
    setState("waiting");
    setCountdown(3);
    setWinnerNumber(null);
    setRollingNumber(0);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
      {/* Canvas para confeti */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      {/* Fondo animado */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-pink-600/10 blur-3xl -top-48 -left-48 animate-pulse-slow" />
        <div
          className="absolute w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl -bottom-48 -right-48 animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      {/* Logo */}
      <div className="absolute top-8 text-center z-10">
        <h1 className="font-display text-2xl font-bold text-white/60">
          🌸 Makallé - Día de la Mujer
        </h1>
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 text-center">
        {/* ESPERANDO */}
        {state === "waiting" && (
          <div className="animate-pulse-slow">
            <div className="text-8xl mb-8"></div>
            <h2 className="font-display text-5xl md:text-7xl font-bold text-white/80">
              Próximo Sorteo
            </h2>
            <p className="text-2xl text-white/40 mt-4 font-display">
              Esperando...
            </p>
          </div>
        )}

        {/* CUENTA REGRESIVA */}
        {state === "countdown" && (
          <div key={countdown} className="animate-countdown">
            <div
              className="font-display text-[15rem] md:text-[20rem] font-black leading-none"
              style={{
                background:
                  countdown === 3
                    ? "linear-gradient(135deg, #e91e63, #f44336)"
                    : countdown === 2
                      ? "linear-gradient(135deg, #ff9800, #ffc107)"
                      : "linear-gradient(135deg, #4caf50, #8bc34a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: "drop-shadow(0 0 60px rgba(233, 30, 99, 0.5))",
              }}
            >
              {countdown}
            </div>
          </div>
        )}

        {/* NÚMEROS GIRANDO */}
        {state === "reveal" && (
          <div>
            <p className="text-2xl text-white/60 font-display mb-4">
              Y el número ganador es...
            </p>
            <div
              className="font-display text-[12rem] md:text-[16rem] font-black text-white/90 leading-none transition-all duration-75"
              style={{ filter: "blur(2px)" }}
            >
              {rollingNumber}
            </div>
          </div>
        )}

        {/* GANADOR */}
        {state === "winner" && (
          <div className="animate-winner-reveal">
            <p className="text-3xl text-yellow-400 font-display mb-6 animate-fade-in">
              🎊 ¡NÚMERO GANADOR! 🎊
            </p>
            <div
              className="font-display text-[12rem] md:text-[18rem] font-black leading-none"
              style={{
                background:
                  "linear-gradient(135deg, #ffd54f, #ffb300, #ff9800)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 80px rgba(255, 213, 79, 0.6))",
              }}
            >
              {winnerNumber}
            </div>
            <p
              className="text-2xl text-white/60 mt-8 font-display animate-fade-in"
              style={{ animationDelay: "1s" }}
            >
              Para reclamar tu premio, acercate con tu DNI
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
