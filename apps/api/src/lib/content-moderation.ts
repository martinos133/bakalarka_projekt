import { readFileSync } from 'fs'
import { join } from 'path'

interface ForbiddenCategory {
  label: string
  action: 'reject' | 'flag'
  words: string[]
}

interface ForbiddenWordsConfig {
  categories: Record<string, ForbiddenCategory>
  rules: {
    case_insensitive: boolean
    check_partial_match: boolean
  }
}

let _config: ForbiddenWordsConfig | null = null

function loadConfig(): ForbiddenWordsConfig {
  if (_config) return _config
  const raw = readFileSync(
    join(__dirname, '..', '..', '..', 'forbidden_words_sk.json'),
    'utf-8',
  )
  _config = JSON.parse(raw) as ForbiddenWordsConfig
  return _config
}

export interface ModerationResult {
  autoApprove: boolean
  reason: string | null
  matchedWords: string[]
  category: string | null
}

const SK_COMMON_WORDS = new Set([
  'je', 'na', 'sa', 'som', 'sme', 'ste', 'sú', 'nie', 'áno',
  'ako', 'ale', 'aby', 'alebo', 'keď', 'pri', 'pre', 'pod',
  'nad', 'od', 'do', 'za', 'po', 'pred', 'bez', 'cez', 'mimo',
  'len', 'iba', 'kde', 'kto', 'čo', 'prečo', 'odkedy',
  'veľmi', 'tiež', 'ešte', 'potom', 'práve', 'teraz',
  'ponúkam', 'prenájom', 'služba', 'služby', 'cena',
  'kontakt', 'viac', 'informácie', 'dobrý', 'deň',
  'ďakujem', 'prosím', 'ponuka', 'kvalita', 'skúsenosti',
  'rokov', 'práca', 'práce', 'dohodou', 'možnosť',
  'celom', 'okolí', 'regióne', 'slovensku',
  'mám', 'máme', 'máte', 'budeme', 'môžem', 'môžete',
  'vám', 'vás', 'nás', 'nám', 'ich', 'jeho', 'jej',
  'tento', 'táto', 'toto', 'tieto', 'tie',
])

const SK_CHARS = /[ľščťžýáíéúäôňďĽŠČŤŽÝÁÍÉÚÄÔŇĎ]/

/**
 * Jednoduchá heuristika: text je „slovenský" ak obsahuje
 * diakritické znaky typické pre SK/CZ alebo dostatočný podiel bežných SK slov.
 */
function looksLikeSlovak(text: string): boolean {
  if (SK_CHARS.test(text)) return true

  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return false
  const skHits = words.filter((w) => SK_COMMON_WORDS.has(w)).length
  return skHits / words.length >= 0.12
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function moderateContent(title: string, description: string): ModerationResult {
  const cfg = loadConfig()
  const fullText = `${title} ${description}`

  if (!looksLikeSlovak(fullText)) {
    return {
      autoApprove: false,
      reason: 'Inzerát nie je v slovenčine – vyžaduje manuálnu kontrolu.',
      matchedWords: [],
      category: 'non_slovak',
    }
  }

  const normText = normalise(fullText)

  for (const [catKey, cat] of Object.entries(cfg.categories)) {
    const matched: string[] = []
    for (const word of cat.words) {
      const normWord = normalise(word)
      if (cfg.rules.check_partial_match) {
        if (normText.includes(normWord)) matched.push(word)
      } else {
        const re = new RegExp(`\\b${normWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
        if (re.test(normText)) matched.push(word)
      }
    }

    if (matched.length > 0) {
      return {
        autoApprove: false,
        reason: `Obsahuje zakázané výrazy (${cat.label}): ${matched.join(', ')}`,
        matchedWords: matched,
        category: catKey,
      }
    }
  }

  return { autoApprove: true, reason: null, matchedWords: [], category: null }
}
