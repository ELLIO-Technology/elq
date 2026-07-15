"""Cross-SDK conformance suite. Every case in elq_sdk/conformance/cases.json
is built through the Python builder here and through the TypeScript builder
in typescript/test/conformance.test.ts; both must emit the exact expected
string, which pins the two SDKs to each other and to the server's canonical
printer.
"""

import json
import unittest
from pathlib import Path

from ellio_elq import and_, f, not_, or_, raw

_CASES_PATH = Path(__file__).resolve().parents[2] / "conformance" / "cases.json"

BUILDERS = {
    "term_keyword": lambda: f("classification").term("malicious"),
    "term_bool": lambda: f("spoofable").term(False),
    "term_int": lambda: f("network.port").term(23),
    "term_ip_bare": lambda: f("ip").term("198.51.100.7"),
    "term_cidr_bare": lambda: f("ip").term("203.0.113.0/24"),
    "term_wildcard": lambda: f("rdns").term("*.googleusercontent.com"),
    "term_slash": lambda: f("http.path").term("/wp-login.php"),
    "term_space": lambda: f("tag").term("Telnet Bruteforce"),
    "term_parens": lambda: f("http.user_agent").term("Mozilla/5.0 (compatible; zgrab/0.x)"),
    "term_embedded_dquote": lambda: f("ssh.auth.password").term('pa"ss'),
    "term_colons": lambda: f("fingerprints.muonfp").term("64240:2-4-8-1-3:1460:7"),
    "not_term": lambda: f("tag").not_term("ssh_bruteforce"),
    "match": lambda: f("http.path").match("admin"),
    "not_match": lambda: f("http.user_agent").not_match("curl"),
    "eq_int": lambda: f("src.asn.number").eq(13335),
    "eq_ip": lambda: f("ip").eq("198.51.100.7"),
    "ne_bool": lambda: f("spoofable").ne(True),
    "gt": lambda: f("src.geo.latitude").gt(50),
    "gte": lambda: f("src.asn.number").gte(1000),
    "lt": lambda: f("active_days").lt(30),
    "lte": lambda: f("active_days").lte(5),
    "in_ints": lambda: f("network.port").in_(22, 23, 2323),
    "in_strings": lambda: f("src.geo.country.code").in_("CN", "RU", "KP"),
    "range_dates": lambda: f("first_seen").range("2026-06-01", "2026-06-30"),
    "range_ints": lambda: f("network.port").range(8000, 9000),
    "exists": lambda: f("classification").exists(),
    "not_exists": lambda: f("rdns").not_exists(),
    "within": lambda: f("last_seen").within("7d"),
    "within_leading_zero": lambda: f("last_seen").within("07d"),
    "date_cmp": lambda: f("last_seen").gte("2026-07-01"),
    "and_flat": lambda: and_(
        f("classification").term("malicious"), f("network.port").term(23)
    ),
    "or_flat": lambda: or_(
        f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")
    ),
    "or_of_and_no_parens": lambda: or_(
        and_(f("tag").term("mirai"), f("spoofable").term(False)),
        f("classification").term("benign"),
    ),
    "and_of_or_parens": lambda: and_(
        or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
        f("classification").term("malicious"),
    ),
    "not_clause": lambda: not_(f("spoofable").term(True)),
    "not_group": lambda: not_(or_(f("tag").term("mirai"), f("tag").term("gafgyt"))),
    "raw_composed": lambda: and_(
        raw('tag:"mirai" OR tag:"gafgyt"'), f("seen").term(True)
    ),
    "mixed_nested": lambda: and_(
        or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
        not_(f("spoofable").term(True)),
        f("network.port").in_(22, 23),
    ),
}


class TestConformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(_CASES_PATH, encoding="utf-8") as fh:
            cls.cases = json.load(fh)["cases"]

    def test_builder_table_covers_exactly_the_shared_cases(self):
        self.assertEqual(sorted(BUILDERS), sorted(c["id"] for c in self.cases))

    def test_every_case_builds_its_expected_canonical_string(self):
        for case in self.cases:
            with self.subTest(case=case["id"]):
                expr = BUILDERS[case["id"]]()
                self.assertEqual(expr.build(), case["elq"])
                # str() is the documented alias of build().
                self.assertEqual(str(expr), case["elq"])


if __name__ == "__main__":
    unittest.main()
