import { BadRequestException } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * Normalizuje a validuje špecifikácie voči aktívnym filtrom kategórie.
 * Výstup obsahuje len kľúče zodpovedajúce filtrom danej kategórie.
 */
export async function validateCategorySpecifications(
  categoryId: string | null | undefined,
  raw: Record<string, unknown> | null | undefined,
): Promise<Record<string, unknown> | null> {
  if (!categoryId) {
    if (raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw as object).length > 0) {
      throw new BadRequestException('Špecifikácie je možné vyplniť až po výbere kategórie');
    }
    return null;
  }

  const filters = await prisma.filter.findMany({
    where: { categoryId, isActive: true },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });

  const input: Record<string, unknown> =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...(raw as Record<string, unknown>) } : {};

  const output: Record<string, unknown> = {};

  for (const f of filters) {
    const v = input[f.slug];

    if (f.type === 'TEXT') {
      if (f.isRequired && isEmpty(v)) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (!isEmpty(v)) {
        output[f.slug] = String(v).trim();
      }
      continue;
    }

    if (f.type === 'NUMBER') {
      if (f.isRequired && (v === undefined || v === null || v === '')) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (v !== undefined && v !== null && v !== '') {
        const n = typeof v === 'number' ? v : parseFloat(String(v));
        if (Number.isNaN(n)) {
          throw new BadRequestException(`Pole „${f.name}“ musí byť číslo`);
        }
        output[f.slug] = n;
      }
      continue;
    }

    if (f.type === 'BOOLEAN') {
      if (f.isRequired && (v === undefined || v === null)) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (v !== undefined && v !== null) {
        output[f.slug] = Boolean(v);
      }
      continue;
    }

    if (f.type === 'DATE') {
      if (f.isRequired && isEmpty(v)) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (!isEmpty(v)) {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) {
          throw new BadRequestException(`Pole „${f.name}“ má neplatný dátum`);
        }
        output[f.slug] = d.toISOString().slice(0, 10);
      }
      continue;
    }

    if (f.type === 'SELECT') {
      if (f.isRequired && isEmpty(v)) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (!isEmpty(v)) {
        const s = String(v);
        if (!f.options.includes(s)) {
          throw new BadRequestException(`Neplatná hodnota pre „${f.name}“`);
        }
        output[f.slug] = s;
      }
      continue;
    }

    if (f.type === 'MULTISELECT') {
      const arr = Array.isArray(v) ? v.map(String) : typeof v === 'string' && v.trim() ? [v.trim()] : [];
      if (f.isRequired && arr.length === 0) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      for (const item of arr) {
        if (!f.options.includes(item)) {
          throw new BadRequestException(`Neplatná hodnota v „${f.name}“`);
        }
      }
      if (arr.length > 0) {
        output[f.slug] = arr;
      }
      continue;
    }

    if (f.type === 'RANGE') {
      let min: number | undefined;
      let max: number | undefined;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const o = v as Record<string, unknown>;
        if (o.min !== undefined && o.min !== null && o.min !== '') {
          min = typeof o.min === 'number' ? o.min : parseFloat(String(o.min));
          if (Number.isNaN(min)) {
            throw new BadRequestException(`Neplatné minimum pre „${f.name}“`);
          }
        }
        if (o.max !== undefined && o.max !== null && o.max !== '') {
          max = typeof o.max === 'number' ? o.max : parseFloat(String(o.max));
          if (Number.isNaN(max)) {
            throw new BadRequestException(`Neplatné maximum pre „${f.name}“`);
          }
        }
      }
      if (f.isRequired && min === undefined && max === undefined) {
        throw new BadRequestException(`Pole „${f.name}“ je povinné`);
      }
      if (min !== undefined || max !== undefined) {
        const range: Record<string, number> = {};
        if (min !== undefined) range.min = min;
        if (max !== undefined) range.max = max;
        output[f.slug] = range;
      }
    }
  }

  if (Object.keys(output).length === 0) {
    return null;
  }
  return output;
}
