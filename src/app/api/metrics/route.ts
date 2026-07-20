import { NextResponse } from "next/server";
import { Redis } from '@upstash/redis';
// Initialise le client Redis via les variables d'environnement Vercel / Upstash
const redis = Redis.fromEnv();


export async function GET() {
  try {
    const currentYear = new Date().getFullYear();
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Exemple de structure dans Redis: "metrics:2026:01"
    const pipeline = redis.pipeline();
    months.forEach((_, index) => {
      const monthKey = String(index + 1).padStart(2, "0");
      pipeline.hgetall(`metrics:${currentYear}:${monthKey}`);
    });

    const results = await pipeline.exec() as any[];

    const monthlyData = months.map((month, index) => {
      const redisResult = results ? results[index][1] as Record<string, string> : {};
      return {
        month,
        temperature: redisResult?.avg_temp ? parseFloat(redisResult.avg_temp) : 0,
        humidity: redisResult?.avg_hum ? parseFloat(redisResult.avg_hum) : 0,
      };
    });

    return NextResponse.json(monthlyData);
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur Redis" }, { status: 500 });
  }
}