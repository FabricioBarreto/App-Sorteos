import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { validateDni } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { dni, raffleId } = await request.json();

    if (!dni) {
      return NextResponse.json(
        { error: "El DNI es requerido." },
        { status: 400 }
      );
    }

    const dniResult = validateDni(dni);
    if (!dniResult.valid) {
      return NextResponse.json(
        { error: "DNI inválido." },
        { status: 400 }
      );
    }

    // Buscar el participante
    const participant = await prisma.participant.findUnique({
      where: { dni: dniResult.cleaned },
    });

    if (!participant) {
      return NextResponse.json({
        valid: false,
        message: "No se encontró ningún participante con ese DNI.",
      });
    }

    // Buscar si este participante ganó algún sorteo
    const raffle = raffleId
      ? await prisma.raffle.findFirst({
          where: { id: raffleId, winnerDni: dniResult.cleaned },
        })
      : await prisma.raffle.findFirst({
          where: { winnerDni: dniResult.cleaned, claimed: false },
          orderBy: { createdAt: "desc" },
        });

    if (!raffle) {
      return NextResponse.json({
        valid: false,
        participantName: participant.name,
        participantNumber: participant.number,
        message: `${participant.name} (N° ${participant.number}) no tiene sorteos ganados pendientes.`,
      });
    }

    // Marcar como reclamado
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: { claimed: true },
    });

    return NextResponse.json({
      valid: true,
      participantName: participant.name,
      participantNumber: participant.number,
      prize: raffle.prize,
      message: `✅ ¡GANADOR CONFIRMADO! ${participant.name} (N° ${participant.number}) - ${raffle.prize}`,
    });
  } catch (error) {
    console.error("Error en validación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
