/**
 * Shared JSDoc type contracts for MTG Match Tracker.
 * Keep this file aligned with ARCHITECTURE.md when introducing new domain models.
 */

/**
 * @typedef {'W' | 'U' | 'B' | 'R' | 'G'} ManaCode
 */

/**
 * @typedef {'V' | 'D' | 'E'} MatchResultCode
 */

/**
 * @typedef {Object} FormatDefinition
 * @property {string} key
 * @property {string} prefix
 * @property {number} defaultOpps
 * @property {boolean} cmdFormat
 * @property {string} badge
 * @property {string} pt
 * @property {string} en
 * @property {string} descPt
 * @property {string} descEn
 */

/**
 * @typedef {Object} MatchRecord
 * @property {number} n
 * @property {string} id
 * @property {string} format
 * @property {number} monthIdx
 * @property {string} month
 * @property {string} year
 * @property {number} deckIdx
 * @property {string} deck
 * @property {boolean} borrowed
 * @property {MatchResultCode} res
 * @property {string} resLabel
 * @property {number} pod
 * @property {string[]} players
 * @property {string} winnerPlayer
 * @property {string[]} enemyCmds
 * @property {string} ordem
 * @property {string} oppStr
 * @property {string} note
 * @property {number | null} turns
 * @property {string} date
 * @property {boolean} pending
 */

/**
 * @typedef {Object} DeckMetaEntry
 * @property {string} [url]
 * @property {string} [updatedAt]
 * @property {string} [updateNote]
 * @property {string} [cmd1]
 * @property {string} [cmd2]
 * @property {boolean} [partner]
 * @property {boolean} [colorsCustom]
 * @property {ManaCode[]} [colors]
 */

export {};
