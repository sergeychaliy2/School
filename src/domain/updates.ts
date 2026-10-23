import { scheduleDoc } from './schedule';

/**
 * The school publishes the timetable only as scanned PDFs, so the app cannot
 * re-parse them automatically. What it can do cheaply is ask the server whether
 * those scans changed: a HEAD request returns ETag + Last-Modified, which we
 * compare against the values recorded when the bundled data was transcribed.
 *
 * A hit means "the scan on the site is newer than what ships in this build" —
 * the app then points the student at the official page rather than guessing.
 */

export type UpdateResult =
  | { status: 'current'; checkedAt: number }
  | { status: 'stale'; checkedAt: number; changed: string[] }
  | { status: 'error'; message: string };

const TIMEOUT_MS = 8000;

async function headWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'HEAD', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function checkForScheduleUpdate(): Promise<UpdateResult> {
  try {
    const changed: string[] = [];

    for (const source of scheduleDoc.sources) {
      const response = await headWithTimeout(source.url);
      if (!response.ok) {
        return { status: 'error', message: `Сервер ответил ${response.status}` };
      }

      const etag = response.headers.get('etag');
      const modified = response.headers.get('last-modified');
      const sameEtag = etag !== null && etag === source.etag;
      const sameDate =
        modified !== null && new Date(modified).getTime() === new Date(source.lastModified).getTime();

      // Some CDNs drop one header or the other; treat either match as unchanged.
      if (!sameEtag && !sameDate) {
        changed.push(`${source.grades[0]}–${source.grades[source.grades.length - 1]} класс`);
      }
    }

    const checkedAt = Date.now();
    return changed.length > 0 ? { status: 'stale', checkedAt, changed } : { status: 'current', checkedAt };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'Сайт школы не ответил вовремя'
        : 'Нет связи с сайтом школы';
    return { status: 'error', message };
  }
}
