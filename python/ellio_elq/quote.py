"""Value quoting for canonical ELQ text.

ELQ has no escape sequences: values with spaces or special characters are
double-quoted, a value containing a double quote is single-quoted, and
shapes the language reads as literals (numbers, booleans, IPv4 addresses,
CIDR blocks, dates, relative times) stay bare. The rules match the Search
API's canonical form exactly, so rendered queries round-trip unchanged.
"""

from __future__ import annotations

import re

__all__ = [
    "needs_quoting",
    "normalize_relative_time",
    "quote_string",
    "quote_value",
    "render_value",
]

# The connective spellings are keywords in every detached position, so a
# value spelling one must be quoted to stay a value.
_KEYWORDS = frozenset({"AND", "OR", "NOT", "IN", "TO"})

# Union of the lexer's list-item and range-bound run terminators: a value
# containing any of these cannot survive as one bare token in every value
# position (plain values, IN list items, range bounds).
_RUN_END = frozenset({"(", ")", '"', "'", ",", "]", " ", "\t", "\n", "\r"})

_RE_NUMBER = re.compile(r"-?\d+(\.\d+)?([eE][+-]?\d+)?")
_RE_IPV4 = re.compile(r"(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})")
_RE_CIDR = re.compile(r"(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})")
_RE_RELTIME = re.compile(r"(\d+)([hdwmy])")
_RE_DATE = re.compile(
    r"\d{4}-\d{2}-\d{2}([Tt]\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[+-]\d{2}:\d{2})?)?"
)


def quote_string(s: str) -> str:
    """Render a string value with quotes.

    ELQ has no escape sequences, so a value containing double quotes is
    rendered with single quotes. A value containing both quote characters
    cannot be represented losslessly and falls back to double quotes.
    """
    if '"' in s and "'" not in s:
        return "'" + s + "'"
    return '"' + s + '"'


def needs_quoting(s: str) -> bool:
    """Report whether a value spliced into a query unquoted would not lex
    back as one bare value token in every value position.

    Mirrors elq.NeedsQuoting: the empty string, connective keyword
    spellings, a leading paren or bracket (which would open a list or
    range), and any run terminator anywhere in the value.
    """
    if s == "":
        return True
    # The ASCII guard mirrors Go's EqualFold, which keeps the Turkish
    # dotless i out of the "IN" orbit; str.upper() would fold it in.
    if s.isascii() and s.upper() in _KEYWORDS:
        return True
    if s[0] in "([)]":
        return True
    return any(c in _RUN_END for c in s)


def quote_value(s: str) -> str:
    """Render a value splice-safe.

    Values that need quoting are quoted exactly like the canonical printer
    quotes string values; every other value (numbers, booleans, relative
    times, dates, identifier-safe strings) is returned unchanged. Mirrors
    elq.QuoteValue.
    """
    if needs_quoting(s):
        return quote_string(s)
    return s


def _is_ipv4(s: str) -> bool:
    m = _RE_IPV4.fullmatch(s)
    return m is not None and all(int(oct) <= 255 for oct in m.groups())


def _is_cidr(s: str) -> bool:
    m = _RE_CIDR.fullmatch(s)
    if m is None:
        return False
    return all(int(oct) <= 255 for oct in m.groups()[:4]) and int(m.group(5)) <= 32


def is_ip_value(s: str) -> bool:
    """Whether a string is a valid bare IPv4 address or CIDR block."""
    return _is_ipv4(s) or _is_cidr(s)


def render_value(v: str | int | float | bool) -> str:
    """Canonical rendering of one clause value.

    Matches what the server's canonical printer emits for the AST the value
    parses to: shapes the lexer classifies as non-string literals (booleans,
    numbers, IPs, CIDRs, relative times, dates) stay bare, everything else
    prints as a quoted string. Note the difference from quote_value: an
    identifier-safe plain string like "malicious" is quoted here, because it
    parses to a string node and the canonical printer always quotes string
    values.
    """
    # bool is checked before int because bool subclasses int in Python.
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return _render_number(v)
    if v in ("true", "false"):
        return v
    if _RE_NUMBER.fullmatch(v) or _is_ipv4(v) or _is_cidr(v) or _RE_DATE.fullmatch(v):
        return v
    m = _RE_RELTIME.fullmatch(v)
    if m is not None:
        # The canonical printer renders relative times as integer + unit, so
        # a leading zero is normalized away (07d prints as 7d).
        return str(int(m.group(1))) + m.group(2)
    return quote_string(v)


def _render_number(v: int | float) -> str:
    # Integral floats render without the trailing ".0" so 50.0 and 50 emit
    # the same query text as the TypeScript SDK, where both are one type.
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def normalize_relative_time(rel: str) -> str | None:
    """Normalize a relative-time shape like "7d"; the builder's within()
    only accepts this shape. Returns None when the shape does not match.
    """
    m = _RE_RELTIME.fullmatch(rel)
    if m is None:
        return None
    return str(int(m.group(1))) + m.group(2)
