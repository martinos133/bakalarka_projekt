import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@inzertna-platforma/database';
import { AdvertisementStatus, CategoryStatus } from '@prisma/client';
import type { SeoOverviewFilters, SeoSection } from './seo-filters.util';
import { filtersToEcho } from './seo-filters.util';

export type SeoStrength = 'silné' | 'stredné' | 'slabé';

export interface SeoPlatformRow {
  id: string;
  label: string;
  score: number;
  strength: SeoStrength;
  summary: string;
  metrics: { label: string; value: string; ok?: boolean }[];
}

export interface SeoKeywordRow {
  term: string;
  count: number;
  source: string;
}

export interface SeoInsight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  actionLabel?: string;
  actionPath?: string;
}

export interface SeoOverviewExtras {
  advertisements?: {
    avgTitleLen: number;
    avgDescLen: number;
    avgImageCount: number;
    inDateRange: number;
  };
  blog?: {
    inDateRange: number;
  };
  staticPages?: {
    inDateRange: number;
  };
  categories?: {
    inDateRange: number;
  };
}

export interface SeoOverview {
  generatedAt: string;
  overallScore: number;
  overallStrength: SeoStrength;
  platforms: SeoPlatformRow[];
  topKeywords: SeoKeywordRow[];
  insights: SeoInsight[];
  counts: {
    activeCategories: number;
    publishedStaticPages: number;
    publishedBlogPosts: number;
    activeAdvertisements: number;
  };
  filters: Record<string, unknown>;
  extras: SeoOverviewExtras;
}

function strengthFromScore(score: number): SeoStrength {
  if (score >= 72) return 'silné';
  if (score >= 45) return 'stredné';
  return 'slabé';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function dateWhere(f: SeoOverviewFilters): Prisma.DateTimeFilter | undefined {
  if (!f.dateFrom && !f.dateTo) return undefined;
  const w: Prisma.DateTimeFilter = {};
  if (f.dateFrom) w.gte = f.dateFrom;
  if (f.dateTo) w.lte = f.dateTo;
  return w;
}

@Injectable()
export class SeoService {
  async getOverview(f: SeoOverviewFilters): Promise<SeoOverview> {
    const dt = dateWhere(f);
    const catWhere: Prisma.CategoryWhereInput = {
      status: CategoryStatus.ACTIVE,
      ...(f.categoryIds?.length ? { id: { in: f.categoryIds } } : {}),
      ...(dt ? { [f.dateField]: dt } : {}),
    };

    const staticWhere: Prisma.StaticPageWhereInput = {
      ...(f.staticScope === 'published' ? { status: 'PUBLISHED' } : {}),
      ...(f.staticScope === 'draft' ? { status: { not: 'PUBLISHED' } } : {}),
      ...(dt ? { [f.dateField]: dt } : {}),
    };

    const blogWhereStatus: Prisma.BlogPostWhereInput =
      f.blogScope === 'published'
        ? { status: 'PUBLISHED' }
        : f.blogScope === 'draft'
          ? { status: 'DRAFT' }
          : {};

    const blogWhere: Prisma.BlogPostWhereInput = {
      ...blogWhereStatus,
      ...(dt ? { [f.dateField]: dt } : {}),
    };

    const adWhere: Prisma.AdvertisementWhereInput = {
      status: { in: f.adStatuses },
      ...(f.adsCategoryId ? { categoryId: f.adsCategoryId } : {}),
      ...(f.adsPriorityOnly ? { priorityBoosted: true } : {}),
      ...(dt ? { [f.dateField]: dt } : {}),
    };

    const [categories, staticPages, blogPosts, ads, draftPosts, draftPages] = await Promise.all([
      prisma.category.findMany({
        where: catWhere,
        select: {
          id: true,
          name: true,
          slug: true,
          metaTitle: true,
          metaDescription: true,
          metaKeywords: true,
          imageAlt: true,
          bannerAlt: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.staticPage.findMany({
        where: staticWhere,
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDescription: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.blogPost.findMany({
        where: blogWhere,
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDescription: true,
          excerpt: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
        },
      }),
      prisma.advertisement.findMany({
        where: adWhere,
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          images: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.blogPost.count({ where: { status: 'DRAFT' } }),
      prisma.staticPage.count({ where: { status: { not: 'PUBLISHED' } } }),
    ]);

    const catTotal = categories.length || 1;
    const catWithMetaTitle = categories.filter((c) => c.metaTitle?.trim()).length;
    const catWithMetaDesc = categories.filter((c) => c.metaDescription?.trim()).length;
    const catWithKeywords = categories.filter((c) => c.metaKeywords?.trim()).length;
    const catWithImageAlt = categories.filter((c) => c.imageAlt?.trim()).length;
    const catWithBannerAlt = categories.filter((c) => c.bannerAlt?.trim()).length;
    const catWithDesc = categories.filter((c) => c.description?.trim()).length;

    const catScore = clamp(
      Math.round(
        (catWithMetaTitle / catTotal) * 22 +
          (catWithMetaDesc / catTotal) * 22 +
          (catWithKeywords / catTotal) * 14 +
          (catWithImageAlt / catTotal) * 12 +
          (catWithBannerAlt / catTotal) * 12 +
          (catWithDesc / catTotal) * 18,
      ),
      0,
      100,
    );

    const pubPages = staticPages.filter((p) => p.status === 'PUBLISHED');
    const draftPagesInFetch = staticPages.filter((p) => p.status !== 'PUBLISHED');
    const pageTotal = pubPages.length || 1;
    const pageWithMetaT = pubPages.filter((p) => p.metaTitle?.trim()).length;
    const pageWithMetaD = pubPages.filter((p) => p.metaDescription?.trim()).length;
    const pageScore =
      pubPages.length === 0
        ? 55
        : clamp(
            Math.round((pageWithMetaT / pageTotal) * 48 + (pageWithMetaD / pageTotal) * 52),
            0,
            100,
          );

    const blogTotal = blogPosts.length || 1;
    const blogWithMetaT = blogPosts.filter((b) => b.metaTitle?.trim()).length;
    const blogWithMetaD = blogPosts.filter((b) => b.metaDescription?.trim()).length;
    const blogWithExcerpt = blogPosts.filter((b) => b.excerpt?.trim()).length;
    const blogScore =
      blogPosts.length === 0
        ? 50
        : clamp(
            Math.round(
              (blogWithMetaT / blogTotal) * 34 +
                (blogWithMetaD / blogTotal) * 33 +
                (blogWithExcerpt / blogTotal) * 33,
            ),
            0,
            100,
          );

    const adTotal = ads.length || 1;
    const adsWithCategory = ads.filter((a) => a.categoryId).length;
    const adsTitleOk = ads.filter((a) => (a.title?.length || 0) >= f.minAdTitleLen).length;
    const adsDescOk = ads.filter((a) => (a.description?.length || 0) >= f.minAdDescLen).length;
    const adsWithImage = ads.filter((a) => Array.isArray(a.images) && a.images.length > 0).length;

    const adScore = clamp(
      Math.round(
        (adsWithCategory / adTotal) * 28 +
          (adsTitleOk / adTotal) * 22 +
          (adsDescOk / adTotal) * 30 +
          (adsWithImage / adTotal) * 20,
      ),
      0,
      100,
    );

    const weights: Record<string, number> = {
      categories: 0.28,
      'static-pages': 0.22,
      blog: 0.22,
      advertisements: 0.28,
    };

    let wSum = 0;
    let scoreAcc = 0;
    const scores: Record<string, number> = {
      categories: catScore,
      'static-pages': pageScore,
      blog: blogScore,
      advertisements: adScore,
    };
    for (const s of f.sections) {
      const w = weights[s] ?? 0;
      wSum += w;
      scoreAcc += (scores[s] ?? 0) * w;
    }
    const overallScore = wSum > 0 ? clamp(Math.round(scoreAcc / wSum), 0, 100) : 0;

    const allPlatforms: SeoPlatformRow[] = [
      {
        id: 'categories',
        label: 'Kategórie',
        score: catScore,
        strength: strengthFromScore(catScore),
        summary: `${catWithMetaTitle}/${categories.length} má meta title, ${catWithMetaDesc}/${categories.length} meta popis.`,
        metrics: [
          { label: 'Aktívnych (výber)', value: String(categories.length), ok: categories.length > 0 },
          { label: 'Meta title', value: `${catWithMetaTitle} / ${categories.length}`, ok: catWithMetaTitle === categories.length },
          { label: 'Meta popis', value: `${catWithMetaDesc} / ${categories.length}`, ok: catWithMetaDesc === categories.length },
          { label: 'Kľúčové slová (meta)', value: `${catWithKeywords} / ${categories.length}`, ok: catWithKeywords >= Math.ceil(categories.length * 0.5) },
          { label: 'Alt obrázka kategórie', value: `${catWithImageAlt} / ${categories.length}`, ok: catWithImageAlt === categories.length },
          { label: 'Alt banneru', value: `${catWithBannerAlt} / ${categories.length}`, ok: catWithBannerAlt >= Math.ceil(categories.length * 0.5) },
        ],
      },
      {
        id: 'static-pages',
        label: 'Statické stránky',
        score: pageScore,
        strength: strengthFromScore(pageScore),
        summary:
          pubPages.length === 0
            ? 'Žiadne publikované stránky v tomto výbere.'
            : `${pageWithMetaT}/${pubPages.length} s meta title, ${pageWithMetaD}/${pubPages.length} s meta popisom.`,
        metrics: [
          { label: 'Publikovaných (výber)', value: String(pubPages.length), ok: pubPages.length > 0 },
          { label: 'Draft v dátach', value: String(draftPagesInFetch.length), ok: draftPagesInFetch.length < 8 },
          { label: 'Globálne nepublikované', value: String(draftPages), ok: draftPages < 8 },
          { label: 'Meta title (pub.)', value: `${pageWithMetaT} / ${pubPages.length || '–'}`, ok: pubPages.length === 0 || pageWithMetaT === pubPages.length },
          { label: 'Meta popis (pub.)', value: `${pageWithMetaD} / ${pubPages.length || '–'}`, ok: pubPages.length === 0 || pageWithMetaD === pubPages.length },
        ],
      },
      {
        id: 'blog',
        label: 'Blog',
        score: blogScore,
        strength: strengthFromScore(blogScore),
        summary:
          blogPosts.length === 0
            ? 'Žiadne články v tomto výbere.'
            : `${blogWithMetaT}/${blogPosts.length} článkov má vlastný meta title.`,
        metrics: [
          { label: 'Článkov vo výbere', value: String(blogPosts.length), ok: blogPosts.length >= 1 },
          { label: 'Globálne drafty', value: String(draftPosts), ok: draftPosts <= 12 },
          { label: 'Meta title', value: `${blogWithMetaT} / ${blogPosts.length || '–'}`, ok: blogPosts.length === 0 || blogWithMetaT >= Math.ceil(blogPosts.length * 0.8) },
          { label: 'Úryvok (excerpt)', value: `${blogWithExcerpt} / ${blogPosts.length || '–'}`, ok: blogPosts.length === 0 || blogWithExcerpt >= Math.ceil(blogPosts.length * 0.7) },
        ],
      },
      {
        id: 'advertisements',
        label: 'Inzeráty (obsah)',
        score: adScore,
        strength: strengthFromScore(adScore),
        summary: `${adsWithCategory}/${ads.length} má kategóriu, ${adsWithImage}/${ads.length} má obrázok. Prah titulku ${f.minAdTitleLen} znakov, popisu ${f.minAdDescLen}.`,
        metrics: [
          { label: 'Inzerátov vo výbere', value: String(ads.length), ok: ads.length > 0 },
          { label: 'Stavy', value: f.adStatuses.join(', '), ok: true },
          { label: 'S kategóriou', value: `${adsWithCategory} / ${ads.length}`, ok: ads.length === 0 || adsWithCategory === ads.length },
          { label: `Titulok ≥ ${f.minAdTitleLen}`, value: `${adsTitleOk} / ${ads.length}`, ok: ads.length === 0 || adsTitleOk >= Math.ceil(ads.length * 0.9) },
          { label: `Popis ≥ ${f.minAdDescLen}`, value: `${adsDescOk} / ${ads.length}`, ok: ads.length === 0 || adsDescOk >= Math.ceil(ads.length * 0.85) },
          { label: 'S obrázkom', value: `${adsWithImage} / ${ads.length}`, ok: ads.length === 0 || adsWithImage >= Math.ceil(ads.length * 0.8) },
        ],
      },
    ];

    const platforms = allPlatforms.filter((p) => f.sections.includes(p.id as SeoSection));

    const keywordMap = new Map<string, { count: number; source: Set<string> }>();

    const addTerms = (raw: string | null | undefined, source: string) => {
      if (!raw?.trim()) return;
      raw
        .split(/[,;]+|\s+/)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length >= 3 && t.length <= 64)
        .forEach((term) => {
          const cur = keywordMap.get(term) || { count: 0, source: new Set<string>() };
          cur.count += 1;
          cur.source.add(source);
          keywordMap.set(term, cur);
        });
    };

    if (f.keywordSources.categoryNames || f.keywordSources.categoryMeta) {
      for (const c of categories) {
        if (f.keywordSources.categoryNames) addTerms(c.name, 'názov kategórie');
        if (f.keywordSources.categoryMeta) {
          addTerms(c.metaKeywords, 'meta kategórie');
          if (c.metaTitle) addTerms(c.metaTitle, 'meta title kategórie');
        }
      }
    }
    if (f.keywordSources.staticMeta) {
      for (const p of pubPages) {
        addTerms(p.metaTitle, 'statická stránka');
      }
    }
    if (f.keywordSources.blogTitles) {
      for (const b of blogPosts) {
        addTerms(b.metaTitle, 'blog meta');
        if (b.title) addTerms(b.title, 'titulok článku');
      }
    }

    const topKeywords: SeoKeywordRow[] = [...keywordMap.entries()]
      .map(([term, v]) => ({
        term,
        count: v.count,
        source: Array.from(v.source)
          .slice(0, 3)
          .join(', '),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, f.keywordLimit);

    const insights: SeoInsight[] = [];

    if (f.sections.includes('categories') && catWithMetaTitle < categories.length) {
      insights.push({
        id: 'cat-meta-title',
        priority: 'high',
        title: 'Doplň meta title u kategórií',
        detail: `${categories.length - catWithMetaTitle} kategórií v aktuálnom výbere nemá meta title.`,
        actionLabel: 'Upraviť kategórie',
        actionPath: '/dashboard/categories',
      });
    }
    if (f.sections.includes('categories') && catWithMetaDesc < categories.length) {
      insights.push({
        id: 'cat-meta-desc',
        priority: 'high',
        title: 'Meta popisy kategórií',
        detail: 'Krátky, unikátny popis pod titulkom vo výsledkoch zvyšuje CTR.',
        actionLabel: 'Kategórie',
        actionPath: '/dashboard/categories',
      });
    }
    if (f.sections.includes('static-pages') && pubPages.length > 0 && pageWithMetaD < pubPages.length) {
      insights.push({
        id: 'pages-meta',
        priority: 'medium',
        title: 'Statické stránky bez meta popisu',
        detail: `${pubPages.length - pageWithMetaD} stránok v tomto výbere nemá meta description.`,
        actionLabel: 'Statické stránky',
        actionPath: '/dashboard/dev/static-pages',
      });
    }
    if (f.sections.includes('blog') && blogPosts.length > 0 && blogWithMetaT < blogPosts.length) {
      insights.push({
        id: 'blog-meta',
        priority: 'medium',
        title: 'Blog: dopln meta title',
        detail: 'Pri aktívnom filtri stále časť článkov nemá vlastný meta title.',
        actionLabel: 'Blog',
        actionPath: '/dashboard/dev/blog',
      });
    }
    if (f.sections.includes('advertisements') && ads.length > 0 && adsWithCategory < ads.length) {
      insights.push({
        id: 'ad-category',
        priority: 'high',
        title: 'Inzeráty bez kategórie',
        detail: `${ads.length - adsWithCategory} záznamov v tomto výbere nemá kategóriu.`,
        actionLabel: 'Inzeráty',
        actionPath: '/dashboard/advertisements',
      });
    }
    if (f.sections.includes('advertisements') && ads.length > 0 && adsWithImage < Math.ceil(ads.length * 0.7)) {
      insights.push({
        id: 'ad-images',
        priority: 'medium',
        title: 'Pridaj obrázky k inzerátom',
        detail: 'V aktuálnom výbere je stále dosť inzerátov bez obrázka.',
        actionLabel: 'Inzeráty',
        actionPath: '/dashboard/advertisements',
      });
    }
    if (f.sections.includes('blog') && blogPosts.length === 0 && draftPosts > 0 && f.blogScope === 'published') {
      insights.push({
        id: 'blog-publish',
        priority: 'low',
        title: 'Publikuj drafty blogu',
        detail: `Globálne máš ${draftPosts} draftov – skús zmeniť filter „Stav blogu“ na „Všetky“ alebo „Draft“.`,
        actionLabel: 'Blog',
        actionPath: '/dashboard/dev/blog',
      });
    }
    if (insights.length === 0) {
      insights.push({
        id: 'all-ok',
        priority: 'low',
        title: 'Pre tento výber nie sú kritické nálezy',
        detail: 'Skús iné časové okno, stavy inzerátov alebo prahy dĺžky textu.',
      });
    }

    insights.sort((a, b) => {
      const o = { high: 0, medium: 1, low: 2 };
      return o[a.priority] - o[b.priority];
    });

    const extras: SeoOverviewExtras = {};
    if (ads.length > 0) {
      const avgTitleLen = Math.round(ads.reduce((s, a) => s + (a.title?.length || 0), 0) / ads.length);
      const avgDescLen = Math.round(ads.reduce((s, a) => s + (a.description?.length || 0), 0) / ads.length);
      const imgSum = ads.reduce((s, a) => s + (Array.isArray(a.images) ? a.images.length : 0), 0);
      extras.advertisements = {
        avgTitleLen,
        avgDescLen,
        avgImageCount: Math.round((imgSum / ads.length) * 10) / 10,
        inDateRange: ads.length,
      };
    }
    if (blogPosts.length >= 0) {
      extras.blog = { inDateRange: blogPosts.length };
    }
    extras.staticPages = { inDateRange: staticPages.length };
    extras.categories = { inDateRange: categories.length };

    return {
      generatedAt: new Date().toISOString(),
      overallScore,
      overallStrength: strengthFromScore(overallScore),
      platforms,
      topKeywords,
      insights,
      counts: {
        activeCategories: categories.length,
        publishedStaticPages: pubPages.length,
        publishedBlogPosts: blogPosts.length,
        activeAdvertisements: ads.length,
      },
      filters: filtersToEcho(f),
      extras,
    };
  }
}
