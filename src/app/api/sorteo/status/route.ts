import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const status = await prisma.raffleStatus.findUnique({
      where: { id: "current" },
    });

    if (!status) {
      return NextResponse.json({ state: "idle", winnerNumber: null });
    }

    return NextResponse.json({
      state: status.state,
      winnerNumber: status.winnerNumber,
    });
  } catch (error) {
    console.error("Error obteniendo estado:", error);
    return NextResponse.json({ state: "idle", winnerNumber: null });
  }
}

// Reset del estado (llamado desde admin después de mostrar ganador)
export async function POST() {
  try {
    await prisma.raffleStatus.upsert({
      where: { id: "current" },
      update: { state: "idle", winnerNumber: null },
      create: { id: "current", state: "idle", winnerNumber: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reseteando estado:", error);
    return NextResponse.json(
      { error: "Error interno." },
      { status: 500 }
    );
  }
}
