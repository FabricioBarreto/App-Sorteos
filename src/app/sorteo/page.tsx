"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  const [countdown, setCountdown] = useState(5);
  const [winnerNumber, setWinnerNumber] = useState<number | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [rollingNumber, setRollingNumber] = useState(0);
  const [showName, setShowName] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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
        setWinnerName(data.winnerName || null);
        setState("countdown");

        fetch("/api/sorteo/status", { method: "POST" });
      }
    } catch {
      // Silenciar errores
    }
  }, [state]);

  useEffect(() => {
    pollingRef.current = setInterval(checkStatus, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [checkStatus]);

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

  useEffect(() => {
    if (state !== "reveal") return;

    let frame = 0;
    const totalFrames = 40;
    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        clearInterval(interval);
        setState("winner");
        return;
      }

      if (frame < totalFrames - 5) {
        setRollingNumber(Math.floor(Math.random() * 999) + 1);
      } else {
        setRollingNumber(winnerNumber!);
      }
      frame++;
    }, 50);

    return () => clearInterval(interval);
  }, [state, winnerNumber]);

  useEffect(() => {
    if (state !== "winner" || !canvasRef.current) return;

    launchConfetti(canvasRef.current);

    const timer1 = setTimeout(() => {
      if (canvasRef.current) launchConfetti(canvasRef.current);
    }, 1500);

    const timer2 = setTimeout(() => {
      setShowName(true);
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [state]);

  const resetSorteo = () => {
    setState("waiting");
    setCountdown(3);
    setWinnerNumber(null);
    setWinnerName(null);
    setRollingNumber(0);
    setShowName(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50"
      />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-pink-600/10 blur-3xl -top-48 -left-48 animate-pulse-slow" />
        <div
          className="absolute w-96 h-96 rounded-full bg-yellow-500/10 blur-3xl -bottom-48 -right-48 animate-pulse-slow"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

      <div className="absolute top-8 text-center z-10">
        <h1 className="font-display text-2xl font-bold text-white/60">
          🌸 Makallé - Día de la Mujer
        </h1>
      </div>

      <div className="relative z-10 text-center">
        {state === "waiting" && (
          <div className="animate-pulse-slow">
            <h2 className="font-display text-5xl md:text-7xl font-bold text-white/80">
              Próximo Sorteo
            </h2>
            <p className="text-2xl text-white/40 mt-4 font-display">
              Esperando...
            </p>
          </div>
        )}

        {state === "countdown" && (
          <div key={countdown} className="animate-countdown">
            <div
              className="font-display text-[15rem] md:text-[20rem] font-black leading-none"
              style={{
                background:
                  countdown === 5
                    ? "linear-gradient(135deg, #9c27b0, #7b1fa2)"
                    : countdown === 4
                      ? "linear-gradient(135deg, #e91e63, #f44336)"
                      : countdown === 3
                        ? "linear-gradient(135deg, #ff9800, #ffc107)"
                        : countdown === 2
                          ? "linear-gradient(135deg, #2196f3, #03a9f4)"
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

        {state === "winner" && (
          <div>
            <p
              className="text-3xl text-yellow-400 font-display mb-6"
              style={{
                animation: "fadeIn 0.5s ease-out forwards",
              }}
            >
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
                animation: "subtleZoom 4s ease-in-out infinite",
              }}
            >
              {winnerNumber}
            </div>

            {showName && winnerName && winnerName !== "Participante" && (
              <div style={{ animation: "slideUpFade 0.8s ease-out forwards" }}>
                <p className="text-xl text-white/40 mt-6 font-display">
                  Felicitaciones a
                </p>
                <p
                  className="text-4xl md:text-5xl text-white font-display font-bold mt-2"
                  style={{
                    textShadow: "0 0 30px rgba(255, 255, 255, 0.3)",
                  }}
                >
                  {winnerName}
                </p>
              </div>
            )}

            <p
              className="text-2xl text-white/60 mt-8 font-display"
              style={{
                animation: "fadeIn 1s ease-out 1s both",
              }}
            >
              Para reclamar tu premio, acercate con tu DNI
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes subtleZoom {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
