import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const prize = body.prize || "Premio";

    // Obtener todos los participantes
    const participants = await prisma.participant.findMany({
      select: { number: true, name: true, dni: true },
    });

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "No hay participantes registrados." },
        { status: 400 }
      );
    }

    // Obtener números ya ganadores para excluirlos
    const previousWinners = await prisma.raffle.findMany({
      select: { winnerNumber: true },
    });
    const excludedNumbers = new Set(previousWinners.map((w) => w.winnerNumber));

    // Filtrar participantes disponibles
    const available = participants.filter((p) => !excludedNumbers.has(p.number));

    if (available.length === 0) {
      return NextResponse.json(
        { error: "Todos los participantes ya ganaron un sorteo." },
        { status: 400 }
      );
    }

    // Seleccionar ganador al azar
    const randomIndex = Math.floor(Math.random() * available.length);
    const winner = available[randomIndex];

    // Actualizar estado del sorteo para la pantalla
    await prisma.raffleStatus.upsert({
      where: { id: "current" },
      update: { state: "countdown", winnerNumber: winner.number },
      create: { id: "current", state: "countdown", winnerNumber: winner.number },
    });

    // Guardar el sorteo
    const raffle = await prisma.raffle.create({
      data: {
        winnerNumber: winner.number,
        winnerName: winner.name,
        winnerDni: winner.dni,
        prize,
      },
    });

    return NextResponse.json({
      success: true,
      raffle: {
        id: raffle.id,
        winnerNumber: winner.number,
        winnerName: winner.name,
        prize,
        createdAt: raffle.createdAt,
      },
    });
  } catch (error) {
    console.error("Error en sorteo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
