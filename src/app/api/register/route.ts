import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth";
import { sanitizeName, validateDni, validateName } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip, RATE_LIMITS.register);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un rato e intentá de nuevo." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { name, dni } = body;

    if (!dni) {
      return NextResponse.json(
        { error: "El DNI es obligatorio." },
        { status: 400 },
      );
    }

    const dniResult = validateDni(dni);
    if (!dniResult.valid) {
      return NextResponse.json(
        { error: "El DNI debe tener 7 u 8 dígitos numéricos." },
        { status: 400 },
      );
    }

    if (name && !validateName(name)) {
      return NextResponse.json(
        { error: "El nombre debe tener entre 2 y 100 caracteres." },
        { status: 400 },
      );
    }

    const existing = await prisma.participant.findUnique({
      where: { dni: dniResult.cleaned },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        number: existing.number,
        name: existing.name,
        message: `Ya estás registrado/a. Tu número es el ${existing.number}.`,
      });
    }

    const cleanName = name ? sanitizeName(name) : "Participante";
    const participant = await prisma.participant.create({
      data: {
        name: cleanName,
        dni: dniResult.cleaned,
        ip,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      number: participant.number,
      name: participant.name,
      message: `¡Registro exitoso! Tu número es el ${participant.number}.`,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor. Intentá de nuevo." },
      { status: 500 },
    );
  }
}
