import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const participants = await prisma.participant.findMany({
      orderBy: { number: "asc" },
      select: {
        id: true,
        name: true,
        dni: true,
        number: true,
        createdAt: true,
      },
    });

    const total = participants.length;

    return NextResponse.json({ participants, total });
  } catch (error) {
    console.error("Error obteniendo participantes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
