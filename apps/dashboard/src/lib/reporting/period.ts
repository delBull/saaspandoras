/**
 * P0.4 — Periodo semanal y zona horaria de negocio.
 *
 * Regla: la semana va de lunes 00:00 a domingo 23:59:59 en `America/Mexico_City`
 * y se convierte a UTC para consultar. NO se asume UTC ni offsets fijos: el
 * offset se calcula con `Intl` para la fecha concreta.
 */

export const BUSINESS_TIMEZONE = 'America/Mexico_City';

export interface PeriodRange {
  fromUtc: string;
  toUtc: string;
  timezone: string;
}

/** Offset (minutos) de la zona respecto a UTC en el instante dado. */
function timezoneOffsetMinutes(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');

  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') === 24 ? 0 : get('hour'),
    get('minute'),
    get('second'),
  );

  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** Componentes locales (año, mes 1-12, día, día de semana 1=lunes … 7=domingo). */
function localParts(instant: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  };

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: weekdayMap[get('weekday')] ?? 1,
  };
}

/** Instante UTC que corresponde a la medianoche local de una fecha. */
function localMidnightUtc(year: number, month: number, day: number, timeZone: string): Date {
  // Aproximación inicial en UTC y corrección por offset real de esa fecha.
  const guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const offset = timezoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offset * 60000);
}

/**
 * Semana (lunes 00:00 → domingo 23:59:59.999) que contiene `reference`.
 */
export function weekRangeFor(reference: Date, timeZone: string = BUSINESS_TIMEZONE): PeriodRange {
  const local = localParts(reference, timeZone);
  const daysFromMonday = local.weekday - 1;

  const mondayLocal = new Date(
    Date.UTC(local.year, local.month - 1, local.day - daysFromMonday, 0, 0, 0),
  );
  const mondayParts = {
    year: mondayLocal.getUTCFullYear(),
    month: mondayLocal.getUTCMonth() + 1,
    day: mondayLocal.getUTCDate(),
  };

  const from = localMidnightUtc(mondayParts.year, mondayParts.month, mondayParts.day, timeZone);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  return {
    fromUtc: from.toISOString(),
    toUtc: to.toISOString(),
    timezone: timeZone,
  };
}

/** Periodo explícito a partir de fechas ISO (se normaliza a la semana que las contiene). */
export function weekRangeForDates(
  fromIso: string,
  timeZone: string = BUSINESS_TIMEZONE,
): PeriodRange {
  return weekRangeFor(new Date(fromIso), timeZone);
}
