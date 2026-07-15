// Cross-SDK conformance suite. Every case in elq_sdk/conformance/cases.json
// is built through the TypeScript builder here and through the Python
// builder in python/tests/test_conformance.py; both must emit the exact
// expected string, which pins the two SDKs to each other and to the
// server's canonical printer.

import { test } from "node:test";
import { deepEqual, equal } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Expr, and_, f, not_, or_, raw } from "../src/builder";

interface Case {
  id: string;
  elq: string;
}

// Compiled test lives in dist/test/, three levels below elq_sdk/.
const casesPath = join(__dirname, "..", "..", "..", "conformance", "cases.json");
const cases: Case[] = JSON.parse(readFileSync(casesPath, "utf8")).cases;

const builders: Record<string, () => Expr> = {
  term_keyword: () => f("classification").term("malicious"),
  term_bool: () => f("spoofable").term(false),
  term_int: () => f("network.port").term(23),
  term_ip_bare: () => f("ip").term("198.51.100.7"),
  term_cidr_bare: () => f("ip").term("203.0.113.0/24"),
  term_wildcard: () => f("rdns").term("*.googleusercontent.com"),
  term_slash: () => f("http.path").term("/wp-login.php"),
  term_space: () => f("tag").term("Telnet Bruteforce"),
  term_parens: () => f("http.user_agent").term("Mozilla/5.0 (compatible; zgrab/0.x)"),
  term_embedded_dquote: () => f("ssh.auth.password").term('pa"ss'),
  term_colons: () => f("fingerprints.muonfp").term("64240:2-4-8-1-3:1460:7"),
  not_term: () => f("tag").notTerm("ssh_bruteforce"),
  match: () => f("http.path").match("admin"),
  not_match: () => f("http.user_agent").notMatch("curl"),
  eq_int: () => f("src.asn.number").eq(13335),
  eq_ip: () => f("ip").eq("198.51.100.7"),
  ne_bool: () => f("spoofable").ne(true),
  gt: () => f("src.geo.latitude").gt(50),
  gte: () => f("src.asn.number").gte(1000),
  lt: () => f("active_days").lt(30),
  lte: () => f("active_days").lte(5),
  in_ints: () => f("network.port").in_(22, 23, 2323),
  in_strings: () => f("src.geo.country.code").in_("CN", "RU", "KP"),
  range_dates: () => f("first_seen").range("2026-06-01", "2026-06-30"),
  range_ints: () => f("network.port").range(8000, 9000),
  exists: () => f("classification").exists(),
  not_exists: () => f("rdns").notExists(),
  within: () => f("last_seen").within("7d"),
  within_leading_zero: () => f("last_seen").within("07d"),
  date_cmp: () => f("last_seen").gte("2026-07-01"),
  and_flat: () => and_(f("classification").term("malicious"), f("network.port").term(23)),
  or_flat: () => or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
  or_of_and_no_parens: () =>
    or_(and_(f("tag").term("mirai"), f("spoofable").term(false)), f("classification").term("benign")),
  and_of_or_parens: () =>
    and_(
      or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
      f("classification").term("malicious")
    ),
  not_clause: () => not_(f("spoofable").term(true)),
  not_group: () => not_(or_(f("tag").term("mirai"), f("tag").term("gafgyt"))),
  raw_composed: () => and_(raw('tag:"mirai" OR tag:"gafgyt"'), f("seen").term(true)),
  mixed_nested: () =>
    and_(
      or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
      not_(f("spoofable").term(true)),
      f("network.port").in_(22, 23)
    ),
};

test("the builder table covers exactly the shared conformance cases", () => {
  deepEqual(
    Object.keys(builders).sort(),
    cases.map((c) => c.id).sort()
  );
});

for (const c of cases) {
  test("conformance: " + c.id, () => {
    const build = builders[c.id];
    equal(build().build(), c.elq);
    // toString() is the documented alias of build().
    equal(String(build()), c.elq);
  });
}
