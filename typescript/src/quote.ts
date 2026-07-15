// Value quoting for canonical ELQ text.
//
// ELQ has no escape sequences: values with spaces or special characters are
// double-quoted, a value containing a double quote is single-quoted, and
// shapes the language reads as literals (numbers, booleans, IPv4 addresses,
// CIDR blocks, dates, relative times) stay bare. The rules match the Search
// API's canonical form exactly, so rendered queries round-trip unchanged.

/**
 * Renders a string value with quotes. ELQ has no escape sequences, so a
 * value containing double quotes is rendered with single quotes. A value
 * containing both quote characters cannot be represented losslessly and
 * falls back to double quotes.
 */
export function quoteString(s: string): string {
  if (s.includes('"') && !s.includes("'")) {
    return "'" + s + "'";
  }
  return '"' + s + '"';
}

// The connective spellings are keywords in every detached position, so a
// value spelling one must be quoted to stay a value.
const KEYWORDS = new Set(["AND", "OR", "NOT", "IN", "TO"]);

function isKeyword(s: string): boolean {
  // The ASCII guard mirrors Go's EqualFold, which keeps the Turkish
  // dotless i out of the "IN" orbit; toUpperCase() would fold it in.
  if (!/^[A-Za-z]+$/.test(s)) {
    return false;
  }
  return KEYWORDS.has(s.toUpperCase());
}

// Union of the lexer's list-item and range-bound run terminators: a value
// containing any of these cannot survive as one bare token in every value
// position (plain values, IN list items, range bounds).
function isRunEnd(c: string): boolean {
  switch (c) {
    case "(":
    case ")":
    case '"':
    case "'":
    case ",":
    case "]":
    case " ":
    case "\t":
    case "\n":
    case "\r":
      return true;
    default:
      return false;
  }
}

/**
 * Reports whether a value spliced into a query unquoted would not lex back
 * as one bare value token in every value position. Mirrors
 * elq.NeedsQuoting: the empty string, connective keyword spellings, a
 * leading paren or bracket (which would open a list or range), and any run
 * terminator anywhere in the value.
 */
export function needsQuoting(s: string): boolean {
  if (s === "") {
    return true;
  }
  if (isKeyword(s)) {
    return true;
  }
  switch (s[0]) {
    case "(":
    case "[":
    case ")":
    case "]":
      return true;
  }
  for (const c of s) {
    if (isRunEnd(c)) {
      return true;
    }
  }
  return false;
}

/**
 * Renders a value splice-safe: values that need quoting are quoted exactly
 * like the canonical printer quotes string values; every other value
 * (numbers, booleans, relative times, dates, identifier-safe strings) is
 * returned unchanged. Mirrors elq.QuoteValue.
 */
export function quoteValue(s: string): string {
  if (needsQuoting(s)) {
    return quoteString(s);
  }
  return s;
}

// ---- bare value shapes (lexer classifyRun) ---------------------------------

const RE_NUMBER = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/;
const RE_IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const RE_CIDR = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/;
const RE_RELTIME = /^(\d+)([hdwmy])$/;
const RE_DATE = /^\d{4}-\d{2}-\d{2}([Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?)?$/;

function isIPv4(s: string): boolean {
  const m = RE_IPV4.exec(s);
  if (m === null) {
    return false;
  }
  return m.slice(1).every((oct) => Number(oct) <= 255);
}

function isCIDR(s: string): boolean {
  const m = RE_CIDR.exec(s);
  if (m === null) {
    return false;
  }
  return m.slice(1, 5).every((oct) => Number(oct) <= 255) && Number(m[5]) <= 32;
}

/** Whether a string is a valid bare IPv4 address or CIDR block */
export function isIPValue(s: string): boolean {
  return isIPv4(s) || isCIDR(s);
}

/**
 * Canonical rendering of one clause value, matching what the server's
 * canonical printer emits for the AST the value parses to: shapes the lexer
 * classifies as non-string literals (booleans, numbers, IPs, CIDRs,
 * relative times, dates) stay bare, everything else prints as a quoted
 * string. Note the difference from quoteValue: an identifier-safe plain
 * string like "malicious" is quoted here, because it parses to a string
 * node and the canonical printer always quotes string values.
 */
export function renderValue(v: string | number | boolean): string {
  if (typeof v === "number") {
    return String(v);
  }
  if (typeof v === "boolean") {
    return v ? "true" : "false";
  }
  if (v === "true" || v === "false") {
    return v;
  }
  if (RE_NUMBER.test(v) || isIPv4(v) || isCIDR(v) || RE_DATE.test(v)) {
    return v;
  }
  const rel = RE_RELTIME.exec(v);
  if (rel !== null) {
    // The canonical printer renders relative times as integer + unit, so a
    // leading zero is normalized away (07d prints as 7d).
    return String(Number(rel[1])) + rel[2];
  }
  return quoteString(v);
}

/**
 * Normalizes a relative-time shape like "7d"; the builder's within() only
 * accepts this shape. Returns null when the shape does not match.
 */
export function normalizeRelativeTime(rel: string): string | null {
  const m = RE_RELTIME.exec(rel);
  if (m === null) {
    return null;
  }
  return String(Number(m[1])) + m[2];
}
