import { Injectable } from '@nestjs/common';
import { prisma } from '@inzertna-platforma/database';
import { AdvertisementStatus, CategoryStatus } from '@prisma/client';

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
}

function strengthFromScore(score: number): SeoStrength {
  if (score >= 72) return 'silné';
  if (score >= 45) return 'stredné';
  return 'slabé';
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

@Injectable()
export class SeoService {
  async getOverview(): Promise<SeoOverview> {
    const [
      categories,
      staticPages,
      blogPosts,
      ads,
    ] = await Promise.all([
      prisma.category.findMany({
        where: { status: CategoryStatus.ACTIVE },
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
        },
      }),
      prisma.staticPage.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDescription: true,
          status: true,
        },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          slug: true,
          title: true,
          metaTitle: true,
          metaDescription: true,
          excerpt: true,
        },
      }),
      prisma.advertisement.findMany({
        where: { status: AdvertisementStatus.ACTIVE },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          images: true,
        },
      }),
    ]);

    const draftPosts = await prisma.blogPost.count({
      where: { status: 'DRAFT' },
    });

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
    const draftPages = staticPages.filter((p) => p.status !== 'PUBLISHED');
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
    const adsTitleOk = ads.filter((a) => (a.title?.length || 0) >= 12).length;
    const adsDescOk = ads.filter((a) => (a.description?.length || 0) >= 120).length;
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

    const weights = { categories: 0.28, staticPages: 0.22, blog: 0.22, ads: 0.28 };
    const overallScore = clamp(
      Math.round(
        catScore * weights.categories +
          pageScore * weights.staticPages +
          blogScore * weights.blog +
          adScore * weights.ads,
      ),
      0,
      100,
    );

    const platforms: SeoPlatformRow[] = [
      {
        id: 'categories',
        label: 'Kategórie',
        score: catScore,
        strength: strengthFromScore(catScore),
        summary: `${catWithMetaTitle}/${categories.length} má meta title, ${catWithMetaDesc}/${categories.length} meta popis.`,
        metrics: [
          { label: 'Aktívnych kategórií', value: String(categories.length), ok: categories.length > 0 },
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
            ? 'Žiadne publikované stránky – dopln obsah alebo publikuj drafty.'
            : `${pageWithMetaT}/${pubPages.length} s meta title, ${pageWithMetaD}/${pubPages.length} s meta popisom.`,
        metrics: [
          { label: 'Publikovaných', value: String(pubPages.length), ok: pubPages.length > 0 },
          { label: 'Draft / neaktívne', value: String(draftPages.length), ok: draftPages.length < 5 },
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
            ? 'Žiadne publikované články – blog neprispieva k organickému trafficu.'
            : `${blogWithMetaT}/${blogPosts.length} článkov má vlastný meta title.`,
        metrics: [
          { label: 'Publikovaných článkov', value: String(blogPosts.length), ok: blogPosts.length >= 3 },
          { label: 'Draft článkov', value: String(draftPosts), ok: draftPosts <= 10 },
          { label: 'Meta title', value: `${blogWithMetaT} / ${blogPosts.length || '–'}`, ok: blogPosts.length === 0 || blogWithMetaT >= Math.ceil(blogPosts.length * 0.8) },
          { label: 'Úryvok (excerpt)', value: `${blogWithExcerpt} / ${blogPosts.length || '–'}`, ok: blogPosts.length === 0 || blogWithExcerpt >= Math.ceil(blogPosts.length * 0.7) },
        ],
      },
      {
        id: 'advertisements',
        label: 'Inzeráty (obsah)',
        score: adScore,
        strength: strengthFromScore(adScore),
        summary: `${adsWithCategory}/${ads.length} má priradenú kategóriu, ${adsWithImage}/${ads.length} má aspoň jeden obrázok.`,
        metrics: [
          { label: 'Aktívnych inzerátov', value: String(ads.length), ok: ads.length > 0 },
          { label: 'S kategóriou', value: `${adsWithCategory} / ${ads.length}`, ok: ads.length === 0 || adsWithCategory === ads.length },
          { label: 'Titulok ≥ 12 znakov', value: `${adsTitleOk} / ${ads.length}`, ok: ads.length === 0 || adsTitleOk >= Math.ceil(ads.length * 0.9) },
          { label: 'Popis ≥ 120 znakov', value: `${adsDescOk} / ${ads.length}`, ok: ads.length === 0 || adsDescOk >= Math.ceil(ads.length * 0.85) },
          { label: 'S obrázkom', value: `${adsWithImage} / ${ads.length}`, ok: ads.length === 0 || adsWithImage >= Math.ceil(ads.length * 0.8) },
        ],
      },
    ];

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

    for (const c of categories) {
      addTerms(c.name, 'názov kategórie');
      addTerms(c.metaKeywords, 'meta kategórie');
      if (c.metaTitle) addTerms(c.metaTitle, 'meta title kategórie');
    }
    for (const p of pubPages) {
      addTerms(p.metaTitle, 'statická stránka');
    }
    for (const b of blogPosts) {
      addTerms(b.metaTitle, 'blog meta');
      if (b.title) addTerms(b.title, 'titulok článku');
    }

    const topKeywords: SeoKeywordRow[] = [...keywordMap.entries()]
      .map(([term, v]) => ({
        term,
        count: v.count,
        source: [...v.source].slice(0, 3).join(', '),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const insights: SeoInsight[] = [];

    if (catWithMetaTitle < categories.length) {
      insights.push({
        id: 'cat-meta-title',
        priority: 'high',
        title: 'Doplň meta title u kategórií',
        detail: `${categories.length - catWithMetaTitle} kategórií nemá vlastný meta title – vo výsledkoch vyhľadávania sa zobrazí generický text.`,
        actionLabel: 'Upraviť kategórie',
        actionPath: '/dashboard/categories',
      });
    }
    if (catWithMetaDesc < categories.length) {
      insights.push({
        id: 'cat-meta-desc',
        priority: 'high',
        title: 'Meta popisy kategórií',
        detail: 'Krátky, unikátny popis pod titulkom vo výsledkoch zvyšuje CTR.',
        actionLabel: 'Kategórie',
        actionPath: '/dashboard/categories',
      });
    }
    if (pubPages.length > 0 && pageWithMetaD < pubPages.length) {
      insights.push({
        id: 'pages-meta',
        priority: 'medium',
        title: 'Statické stránky bez meta popisu',
        detail: `${pubPages.length - pageWithMetaD} publikovaných stránok nemá meta description.`,
        actionLabel: 'Statické stránky',
        actionPath: '/dashboard/dev/static-pages',
      });
    }
    if (blogPosts.length > 0 && blogWithMetaT < blogPosts.length) {
      insights.push({
        id: 'blog-meta',
        priority: 'medium',
        title: 'Blog: zjednoť meta title s názvom článku',
        detail: 'Vlastný meta title môže lepšie cieliť na long-tail vyhľadávania než len titulok článku.',
        actionLabel: 'Blog',
        actionPath: '/dashboard/dev/blog',
      });
    }
    if (ads.length > 0 && adsWithCategory < ads.length) {
      insights.push({
        id: 'ad-category',
        priority: 'high',
        title: 'Inzeráty bez kategórie',
        detail: `${ads.length - adsWithCategory} aktívnych inzerátov nemá kategóriu – horšia navigácia a interné prepojenia.`,
        actionLabel: 'Inzeráty',
        actionPath: '/dashboard/advertisements',
      });
    }
    if (ads.length > 0 && adsWithImage < Math.ceil(ads.length * 0.7)) {
      insights.push({
        id: 'ad-images',
        priority: 'medium',
        title: 'Pridaj obrázky k inzerátom',
        detail: 'Vizuálny obsah zlepšuje angažovanosť a zdieľanie v sociálnych sieťach (OG z obrázkov inzerátu).',
        actionLabel: 'Inzeráty',
        actionPath: '/dashboard/advertisements',
      });
    }
    if (blogPosts.length === 0 && draftPosts > 0) {
      insights.push({
        id: 'blog-publish',
        priority: 'low',
        title: 'Publikuj pripravené články',
        detail: `Máš ${draftPosts} draftov – po publikovaní rastie počet indexovateľných URL.`,
        actionLabel: 'Blog',
        actionPath: '/dashboard/dev/blog',
      });
    }
    if (insights.length === 0) {
      insights.push({
        id: 'all-ok',
        priority: 'low',
        title: 'Základ SEO vyzerá v poriadku',
        detail: 'Pokračuj v doplňovaní meta údajov pri novom obsahu a sleduj Core Web Vitals v produkcii.',
      });
    }

    insights.sort((a, b) => {
      const o = { high: 0, medium: 1, low: 2 };
      return o[a.priority] - o[b.priority];
    });

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
    };
  }
}
