// app/api/redis/route.ts
import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { SensorPayload } from '@/types/mqtt';

// Initialise le client Redis via les variables d'environnement Vercel / Upstash
const redis = Redis.fromEnv();

const REDIS_HISTORY_KEY = 'esp32_wokwi:sensor_history';
const MAX_HISTORY_ITEMS = 15000; // Nombre maximal de mesures à conserver dans l'historique

/**
 * GET : Récupère les anciennes mesures stockées dans Redis
 */
export async function GET() {
  try {
    // Récupère toute la liste d'éléments dans le tableau Redis (de 0 à -1)
    const history = await redis.lrange<SensorPayload>(REDIS_HISTORY_KEY, 0, -1);
    
    return NextResponse.json({
      success: true,
      data: history || [],
    });
  } catch (error) {
    console.error('[API Redis GET Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Impossible de récupérer les données.' },
      { status: 500 }
    );
  }
}

/**
 * POST : Persiste une nouvelle mesure envoyée par l'ESP32
 */
export async function POST(req: Request) {
  try {
    const payload: SensorPayload = await req.json();

    if (!payload || typeof payload.temperature !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Payload invalide' },
        { status: 400 }
      );
    }

    // Ajoute un timestamp ISO au payload s'il n'existe pas déjà
    const enrichedPayload = {
      ...payload,
      timestamp: new Date().toISOString(),
    };

    // 1. Ajoute au début de la liste Redis (LPUSH)
    await redis.lpush(REDIS_HISTORY_KEY, enrichedPayload);

    // 2. Conserve uniquement les N plus récentes (LTRIM) pour ne pas saturer la mémoire
    await redis.ltrim(REDIS_HISTORY_KEY, 0, MAX_HISTORY_ITEMS - 1);

    return NextResponse.json({
      success: true,
      data: enrichedPayload,
    });
  } catch (error) {
    console.error('[API Redis POST Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Échec de la sauvegarde dans Redis.' },
      { status: 500 }
    );
  }
}