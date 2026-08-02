import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';
import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

/**
 * `@SkipThrottle()` a nivel de controller (035, hallazgo de la prueba de
 * carga real): el límite global de 100 req/min por IP se aplicaba también
 * a `/health*`, así que un orquestador o balanceador que sondea salud cada
 * pocos segundos —o una prueba de carga cualquiera— agotaba la cuota y
 * empezaba a recibir 429 en el probe de vida, lo que dispararía reinicios
 * de contenedor completamente injustificados. Verificado en vivo: con
 * autocannon a 50 conexiones/10s contra `/health/live` sin este fix, solo
 * 100 de ~224k requests devolvían 200 — el resto, 429.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }

  /**
   * Liveness (035 §4): solo confirma que el proceso responde. Deliberadamente
   * NO valida Postgres/Redis — un orquestador (Kubernetes, Railway) que use
   * esta ruta como liveness probe reiniciaría el contenedor ante una caída de
   * la base de datos, lo cual empeora el incidente en vez de ayudar. Eso es
   * trabajo de `/health/ready`.
   */
  @Public()
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /**
   * Readiness (035 §4): valida las dependencias externas — si Postgres o
   * Redis no responden, el pod debe salir de rotación (dejar de recibir
   * tráfico) sin reiniciarse, a diferencia de liveness.
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('database'),
      () => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
