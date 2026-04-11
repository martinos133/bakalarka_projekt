import { AdvertisementStatus } from '@prisma/client';

export type SeoSection = 'categories' | 'static-pages' | 'blog' | 'advertisements';
export type BlogScope = 'published' | 'draft' | 'both';
export type StaticScope = 'published' | 'draft' | 'both';
export type DateField = 'createdAt' | 'updatedAt';

const ALL_SECTIONS: SeoSection[] = ['categories', 'static-pages', 'blog', 'advertisements'];

export interface SeoOverviewFilters {
  sections: SeoSection[];
  adStatuses: AdvertisementStatus[];
  adsCategoryId: string | null;
  adsPriorityOnly: boolean;
  blogScope: BlogScope;
  staticScope: StaticScope;
  categoryIds: string[] | null;
  dateFrom: Date | null;
  dateTo: Date | null;
  dateField: DateField;
  minAdTitleLen: number;
  minAdDescLen: number;
  keywordLimit: number;
  keywordSources: {
    categoryNames: boolean;
    categoryMeta: boolean;
    blogTitles: boolean;
    staticMeta: boolean;
  };
}

export function parseSeoOverviewFilters(q: Record<string, string | string[] | undefined>): SeoOverviewFilters {
  const g = (k: string): string | undefined => {
    const v = q[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };

  const sectionsRaw = g('sections');
  let sections: SeoSection[] = ALL_SECTIONS;
  if (sectionsRaw?.trim()) {
    const parts = sectionsRaw.split(',').map((s) => s.trim()).filter(Boolean) as SeoSection[];
    const ok = new Set(ALL_SECTIONS);
    const f = parts.filter((p) => ok.has(p));
    if (f.length) sections = f;
  }

  const adStatusesRaw = g('adStatuses');
  let adStatuses: AdvertisementStatus[] = [AdvertisementStatus.ACTIVE];
  if (adStatusesRaw?.trim()) {
    const parts = adStatusesRaw.split(',').map((s) => s.trim().toUpperCase()) as string[];
    const allowed = new Set(Object.values(AdvertisementStatus));
    const f = parts.filter((p) => allowed.has(p as AdvertisementStatus)) as AdvertisementStatus[];
    if (f.length) adStatuses = f;
  }

  const blogScope = (['published', 'draft', 'both'] as const).includes(g('blogScope') as BlogScope)
    ? (g('blogScope') as BlogScope)
    : 'published';

  const staticScope = (['published', 'draft', 'both'] as const).includes(g('staticScope') as StaticScope)
    ? (g('staticScope') as StaticScope)
    : 'published';

  const adsCategoryId = g('adsCategoryId')?.trim() || null;
  const adsPriorityOnly = g('adsPriorityOnly') === '1' || g('adsPriorityOnly') === 'true';

  let categoryIds: string[] | null = null;
  const catIdsRaw = g('categoryIds');
  if (catIdsRaw?.trim()) {
    categoryIds = catIdsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    if (categoryIds.length === 0) categoryIds = null;
  }

  const dateField: DateField = g('dateField') === 'createdAt' ? 'createdAt' : 'updatedAt';

  let dateFrom: Date | null = null;
  let dateTo: Date | null = null;
  const df = g('dateFrom');
  const dt = g('dateTo');
  if (df) {
    const d = new Date(df);
    if (!Number.isNaN(d.getTime())) dateFrom = d;
  }
  if (dt) {
    const d = new Date(dt + 'T23:59:59.999Z');
    if (!Number.isNaN(d.getTime())) dateTo = d;
  }

  const minAdTitleLen = clampInt(g('minAdTitleLen'), 1, 200, 12);
  const minAdDescLen = clampInt(g('minAdDescLen'), 1, 50000, 120);
  const keywordLimit = clampInt(g('keywordLimit'), 5, 80, 20);

  const kwCat = g('kwCategoryNames');
  const kwMeta = g('kwCategoryMeta');
  const kwBlog = g('kwBlog');
  const kwStatic = g('kwStatic');
  const keywordSources = {
    categoryNames: kwCat === undefined ? true : kwCat === '1' || kwCat === 'true',
    categoryMeta: kwMeta === undefined ? true : kwMeta === '1' || kwMeta === 'true',
    blogTitles: kwBlog === undefined ? true : kwBlog === '1' || kwBlog === 'true',
    staticMeta: kwStatic === undefined ? true : kwStatic === '1' || kwStatic === 'true',
  };

  return {
    sections,
    adStatuses,
    adsCategoryId,
    adsPriorityOnly,
    blogScope,
    staticScope,
    categoryIds,
    dateFrom,
    dateTo,
    dateField,
    minAdTitleLen,
    minAdDescLen,
    keywordLimit,
    keywordSources,
  };
}

function clampInt(raw: string | undefined, min: number, max: number, def: number): number {
  if (!raw?.trim()) return def;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export function filtersToEcho(f: SeoOverviewFilters): Record<string, unknown> {
  return {
    sections: f.sections,
    adStatuses: f.adStatuses,
    adsCategoryId: f.adsCategoryId,
    adsPriorityOnly: f.adsPriorityOnly,
    blogScope: f.blogScope,
    staticScope: f.staticScope,
    categoryIds: f.categoryIds,
    dateFrom: f.dateFrom?.toISOString() ?? null,
    dateTo: f.dateTo?.toISOString() ?? null,
    dateField: f.dateField,
    minAdTitleLen: f.minAdTitleLen,
    minAdDescLen: f.minAdDescLen,
    keywordLimit: f.keywordLimit,
    keywordSources: f.keywordSources,
  };
}
