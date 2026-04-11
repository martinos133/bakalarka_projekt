import { BadRequestException } from '@nestjs/common';

const MAX_HTTP_URL = 2048;
const MAX_DATA_URL = 400_000;

/** Povolené https URL alebo data:image/(jpeg|png|webp);base64,... */
export function normalizeAvatarUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'string') {
    throw new BadRequestException('Neplatný formát profilovky');
  }
  const s = raw.trim();
  if (s.length === 0) return null;

  if (s.startsWith('https://') || s.startsWith('http://')) {
    if (s.length > MAX_HTTP_URL) {
      throw new BadRequestException('URL profilovky je príliš dlhá');
    }
    try {
      // eslint-disable-next-line no-new
      new URL(s);
    } catch {
      throw new BadRequestException('Neplatná URL profilovky');
    }
    return s;
  }

  if (s.startsWith('data:image/jpeg;base64,') || s.startsWith('data:image/jpg;base64,')) {
    if (s.length > MAX_DATA_URL) {
      throw new BadRequestException('Obrázok je príliš veľký (max. cca 300 kB po kompresii)');
    }
    return s;
  }
  if (s.startsWith('data:image/png;base64,')) {
    if (s.length > MAX_DATA_URL) {
      throw new BadRequestException('Obrázok je príliš veľký (max. cca 300 kB po kompresii)');
    }
    return s;
  }
  if (s.startsWith('data:image/webp;base64,')) {
    if (s.length > MAX_DATA_URL) {
      throw new BadRequestException('Obrázok je príliš veľký (max. cca 300 kB po kompresii)');
    }
    return s;
  }

  throw new BadRequestException(
    'Profilovka musí byť platná http(s) URL alebo obrázok JPEG/PNG/WebP (base64)',
  );
}
