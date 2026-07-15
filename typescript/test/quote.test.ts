// Unit tests for the quoting port. The expectations mirror the behavior of
// the Search API's canonical printer and
// the lexer's bare shapes, including the subtle cases: a leading bracket
// needs quoting but a mid-string "[" does not, while "]" ends a range bound
// anywhere.

import { test } from "node:test";
import { equal, ok, throws } from "node:assert/strict";
import { needsQuoting, quoteString, quoteValue, renderValue } from "../src/quote";
import { f } from "../src/builder";

test("needsQuoting: values that must be quoted", () => {
  const yes = [
    "",
    "AND",
    "and",
    "Or",
    "not",
    "In",
    "to",
    "(x",
    "[x",
    ")x",
    "]x",
    "a]b",
    "a,b",
    "a b",
    "tab\there",
    'quo"te',
    "quo'te",
    "paren(s)",
  ];
  for (const s of yes) {
    ok(needsQuoting(s), JSON.stringify(s) + " should need quoting");
  }
});

test("needsQuoting: values that splice bare", () => {
  const no = [
    "mirai",
    "198.51.100.7",
    "203.0.113.0/24",
    "7d",
    "wp-login",
    "64240:2-4-8-1-3:1460:7",
    "*.example.com",
    "a[b",
    "ANDROID",
    "INTO",
  ];
  for (const s of no) {
    ok(!needsQuoting(s), JSON.stringify(s) + " should not need quoting");
  }
});

test("quoteValue quotes exactly the values that need it", () => {
  equal(quoteValue("mirai"), "mirai");
  equal(quoteValue("Telnet Bruteforce"), '"Telnet Bruteforce"');
  equal(quoteValue("AND"), '"AND"');
  equal(quoteValue('pa"ss'), "'pa\"ss'");
});

test("quoteString single-quotes values with double quotes, else double-quotes", () => {
  equal(quoteString("plain"), '"plain"');
  equal(quoteString('pa"ss'), "'pa\"ss'");
  equal(quoteString("pa'ss"), '"pa\'ss"');
  // Both quote characters cannot be represented losslessly; double quotes
  // are the documented fallback.
  equal(quoteString("a\"b'c"), '"a"b\'c"');
});

test("renderValue keeps lexer bare shapes bare and quotes plain strings", () => {
  equal(renderValue("malicious"), '"malicious"');
  equal(renderValue(true), "true");
  equal(renderValue("true"), "true");
  equal(renderValue(23), "23");
  equal(renderValue("23"), "23");
  equal(renderValue("-1.5"), "-1.5");
  equal(renderValue("198.51.100.7"), "198.51.100.7");
  equal(renderValue("203.0.113.0/24"), "203.0.113.0/24");
  equal(renderValue("2026-06-01"), "2026-06-01");
  equal(renderValue("2026-06-15T12:00:00+02:00"), "2026-06-15T12:00:00+02:00");
  equal(renderValue("7d"), "7d");
  equal(renderValue("07d"), "7d");
  // Out-of-range octets and prefixes are not IP shapes; they fall back to
  // quoted strings exactly like the server treats them as plain words.
  equal(renderValue("198.51.100.999"), '"198.51.100.999"');
  equal(renderValue("203.0.113.0/33"), '"203.0.113.0/33"');
  equal(renderValue("*.example.com"), '"*.example.com"');
});

test("runtime operator gating mirrors the type-level constraints", () => {
  throws(() => (f("seen") as any).gt(5), /not valid for field "seen" \(type "bool"\)/);
  throws(() => (f("classification") as any).within("7d"), /within\(\) is not valid/);
  throws(() => (f("last_seen") as any).in_("7d"), /not valid for field "last_seen"/);
  throws(() => (f as any)("no_such_field"), /unknown ELQ field/);
  throws(() => f("last_seen").within("soon"), /invalid relative time/);
});

test("ip fields reject values that are not IPv4 or CIDR", () => {
  // The server's analyzer refuses non-IP values on the ip field, so the
  // builder fails fast instead of emitting a query that would 400.
  throws(() => f("ip").term("198.51.100.999"), /IPv4 address or CIDR/);
  throws(() => f("ip").term("not-an-ip"), /IPv4 address or CIDR/);
  throws(() => f("ip").in_("198.51.100.7", "bad"), /IPv4 address or CIDR/);
  throws(() => f("ip").range("198.51.100.999", "198.51.100.50"), /IPv4 address or CIDR/);
  equal(f("ip").term("198.51.100.7").toString(), "ip:198.51.100.7");
  equal(f("ip").term("203.0.113.0/24").toString(), "ip:203.0.113.0/24");
});

test("type-level gating: unsupported methods do not exist on the handle", () => {
  // The closures are never called: the point is that tsc rejects each body,
  // which the @ts-expect-error annotations assert at compile time.
  const rejected = [
    // @ts-expect-error bool fields do not expose gt
    () => f("seen").gt,
    // @ts-expect-error keyword fields do not expose within
    () => f("classification").within,
    // @ts-expect-error date fields do not expose in_
    () => f("last_seen").in_,
    // @ts-expect-error ip fields do not expose exists
    () => f("ip").exists,
    // @ts-expect-error only catalog field names are accepted
    () => f("no_such_field"),
  ];
  equal(rejected.length, 5);
});
