import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Try to query the database to verify connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", environment: "production", database: "connected" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ status: "error", environment: "production", database: "disconnected", error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
