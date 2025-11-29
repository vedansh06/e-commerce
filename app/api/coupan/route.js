import prisma from "@/lib/prisma";
import { useAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Verify Coupan
export async function POST(request) {
  try {
    const { userId, has } = useAuth(request);
    const { code } = await request.json();

    const coupan = await prisma.coupan.findUnique({
      where: { code: code.toUpperCase(), expiresAt: { gt: new Date() } },
    });
    if (!coupan) {
      return NextResponse.json({ error: "Coupan not found" }, { status: 404 });
    }
    if (coupan.forNewUser) {
      const useorders = await prisma.order.findMany({ where: { userId } });
      if (useorders.length > 0) {
        return NextResponse.json(
          { error: "Coupan valid for new user" },
          { status: 400 }
        );
      }
    }
    if (coupan.forMember) {
      const hasPlusPlan = has({ plan: "plus" });
      if (!hasPlusPlan) {
        return NextResponse.json(
          { error: "Coupan valid for members" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ coupan });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}
