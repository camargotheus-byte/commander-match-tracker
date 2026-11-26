import { STORAGE_KEYS, readString, writeString } from '../storage/storage.service.js';

export const MTG_FORMAT_GROUPS = [
  {
    pt: 'Commander & Multiplayer',
    en: 'Commander & Multiplayer',
    items: [
      { key: 'commander', prefix: 'CMD', defaultOpps: 3, cmdFormat: true, badge: 'MTG COMMANDER', pt: 'Commander (EDH)', en: 'Commander (EDH)', descPt: '100 cartas singleton · Mesão', descEn: '100-card singleton · Multiplayer' },
      { key: 'cedh', prefix: 'CEDH', defaultOpps: 3, cmdFormat: true, badge: 'MTG cEDH', pt: 'cEDH', en: 'cEDH', descPt: 'Commander competitivo', descEn: 'Competitive Commander' },
      { key: 'duel', prefix: 'DUEL', defaultOpps: 1, cmdFormat: true, badge: 'MTG DUEL COMMANDER', pt: 'Duel Commander (1v1)', en: 'Duel Commander (1v1)', descPt: 'Commander 1v1 com banlist própria', descEn: '1v1 Commander with dedicated banlist' },
      { key: 'pdh', prefix: 'PDH', defaultOpps: 3, cmdFormat: true, badge: 'MTG PAUPER EDH', pt: 'Pauper Commander (PDH)', en: 'Pauper Commander (PDH)', descPt: 'Comandante incomum + 99 comuns', descEn: 'Uncommon commander + 99 commons' },
      { key: 'brawl', prefix: 'BRL', defaultOpps: 1, cmdFormat: true, badge: 'MTG BRAWL', pt: 'Brawl', en: 'Brawl', descPt: '60 ou 100 cartas · Standard / Arena', descEn: '60 or 100 cards · Standard / Arena' },
      { key: 'oathbreaker', prefix: 'OATH', defaultOpps: 3, cmdFormat: true, badge: 'MTG OATHBREAKER', pt: 'Oathbreaker', en: 'Oathbreaker', descPt: 'Planeswalker + Feitiço Assinatura', descEn: 'Planeswalker + Signature Spell' },
      { key: '2hg', prefix: '2HG', defaultOpps: 2, cmdFormat: false, badge: 'MTG 2HG', pt: 'Two-Headed Giant (2HG)', en: 'Two-Headed Giant (2HG)', descPt: 'Duplas 2v2 com vida compartilhada', descEn: '2v2 teams with shared life total' },
      { key: 'planechase', prefix: 'PLC', defaultOpps: 3, cmdFormat: true, badge: 'MTG PLANECHASE', pt: 'Planechase', en: 'Planechase', descPt: 'Multiplayer com baralho de Planos', descEn: 'Multiplayer with Planar deck' }
    ]
  },
  {
    pt: 'Construído (60 cartas)',
    en: 'Constructed (60-card)',
    items: [
      { key: 'standard', prefix: 'STD', defaultOpps: 1, cmdFormat: false, badge: 'MTG STANDARD', pt: 'Standard (Padrão)', en: 'Standard', descPt: 'Coleções recentes · Rotativo', descEn: 'Recent sets · Rotating' },
      { key: 'pioneer', prefix: 'PIO', defaultOpps: 1, cmdFormat: false, badge: 'MTG PIONEER', pt: 'Pioneer (Pioneiro)', en: 'Pioneer', descPt: 'Desde Retorno a Ravnica (2012)', descEn: 'Return to Ravnica (2012) forward' },
      { key: 'modern', prefix: 'MOD', defaultOpps: 1, cmdFormat: false, badge: 'MTG MODERN', pt: 'Modern (Moderno)', en: 'Modern', descPt: 'Desde 8ª Edição (2003)', descEn: '8th Edition (2003) forward' },
      { key: 'legacy', prefix: 'LEG', defaultOpps: 1, cmdFormat: false, badge: 'MTG LEGACY', pt: 'Legacy (Legado)', en: 'Legacy', descPt: 'Eternal · quase toda a história', descEn: 'Eternal · nearly all sets' },
      { key: 'vintage', prefix: 'VIN', defaultOpps: 1, cmdFormat: false, badge: 'MTG VINTAGE', pt: 'Vintage', en: 'Vintage', descPt: 'Eternal · Power Nine restrito', descEn: 'Eternal · Power Nine restricted' },
      { key: 'pauper', prefix: 'PAU', defaultOpps: 1, cmdFormat: false, badge: 'MTG PAUPER', pt: 'Pauper', en: 'Pauper', descPt: 'Apenas cartas comuns', descEn: 'Commons only' },
      { key: 'historic', prefix: 'HIS', defaultOpps: 1, cmdFormat: false, badge: 'MTG HISTORIC', pt: 'Historic', en: 'Historic', descPt: 'MTG Arena · Eternal digital', descEn: 'MTG Arena · Digital eternal' },
      { key: 'timeless', prefix: 'TML', defaultOpps: 1, cmdFormat: false, badge: 'MTG TIMELESS', pt: 'Timeless', en: 'Timeless', descPt: 'MTG Arena · sem banimentos', descEn: 'MTG Arena · No bans' },
      { key: 'alchemy', prefix: 'ALC', defaultOpps: 1, cmdFormat: false, badge: 'MTG ALCHEMY', pt: 'Alchemy', en: 'Alchemy', descPt: 'MTG Arena · cartas rebalanceadas', descEn: 'MTG Arena · Rebalanced cards' },
      { key: 'premodern', prefix: 'PRE', defaultOpps: 1, cmdFormat: false, badge: 'MTG PREMODERN', pt: 'Premodern', en: 'Premodern', descPt: 'Clássico (4ª Ed. a Flagelo)', descEn: 'Classic (4th Ed. to Scourge)' }
    ]
  },
  {
    pt: 'Limitado',
    en: 'Limited',
    items: [
      { key: 'draft', prefix: 'DRF', defaultOpps: 1, cmdFormat: false, badge: 'MTG BOOSTER DRAFT', pt: 'Booster Draft', en: 'Booster Draft', descPt: 'Montagem escolhendo de boosters', descEn: 'Pick-and-pass booster drafting' },
      { key: 'sealed', prefix: 'SLD', defaultOpps: 1, cmdFormat: false, badge: 'MTG SEALED', pt: 'Sealed Deck (Selado)', en: 'Sealed Deck', descPt: '6 boosters · Pré-lançamento', descEn: '6 boosters · Prerelease' },
      { key: 'cube', prefix: 'CUB', defaultOpps: 1, cmdFormat: false, badge: 'MTG CUBE DRAFT', pt: 'Cube Draft', en: 'Cube Draft', descPt: 'Draft de cubo curado', descEn: 'Curated custom Cube draft' },
      { key: 'jumpstart', prefix: 'JMP', defaultOpps: 1, cmdFormat: false, badge: 'MTG JUMPSTART', pt: 'Jumpstart', en: 'Jumpstart', descPt: '2 pacotes temáticos misturados', descEn: 'Shuffle 2 themed packs together' }
    ]
  },
  {
    pt: 'Casual',
    en: 'Casual',
    items: [
      { key: 'casual', prefix: 'CAS', defaultOpps: 1, cmdFormat: false, badge: 'MTG CASUAL', pt: 'Kitchen Table / Casual', en: 'Kitchen Table / Casual', descPt: 'Mesão livre sem restrições', descEn: 'Freeform casual play' }
    ]
  }
];

export const MTG_FORMATS = MTG_FORMAT_GROUPS.flatMap(g => g.items);

export function getFormatDef(key) {
  return MTG_FORMATS.find(f => f.key === key) || MTG_FORMATS[0];
}

export function loadFormat() {
  const raw = readString(STORAGE_KEYS.FORMAT, 'commander');
  return MTG_FORMATS.some(f => f.key === raw) ? raw : 'commander';
}

export function saveFormat(key) {
  writeString(STORAGE_KEYS.FORMAT, key);
}
