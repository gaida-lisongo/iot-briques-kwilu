import { NextRequest, NextResponse } from "next/server";
import { Redis } from '@upstash/redis';


// Initialise le client Redis via les variables d'environnement Vercel / Upstash
const redis = Redis.fromEnv();


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Exemple de structure dans Redis: "readings:2026-07-20"
    const rawReadings = await redis.lrange(`readings:${date}`, 0, 100);

    const readings = rawReadings.map((item) => JSON.parse(item));

    return NextResponse.json(readings);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur Redis" }, { status: 500 });
  }
}