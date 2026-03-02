import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  try {
    const auth = await isAuthenticated();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const raffles = await prisma.raffle.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ raffles });
  } catch (error) {
    console.error("Error obteniendo historial:", error);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
