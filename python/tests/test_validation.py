"""Runtime operator validation, the Python counterpart of the TypeScript
type-level gating: an operator a field's type does not support must raise
ValueError naming the field, its type, and the allowed operators.
"""

import unittest

from ellio_elq import and_, f, or_


class TestOperatorValidation(unittest.TestCase):
    def test_bool_field_rejects_comparison(self):
        with self.assertRaises(ValueError) as ctx:
            f("seen").gt(5)
        msg = str(ctx.exception)
        self.assertIn("'seen'", msg)
        self.assertIn("'bool'", msg)
        self.assertIn("allowed operators", msg)
        self.assertIn("!=", msg)

    def test_keyword_field_rejects_within(self):
        with self.assertRaises(ValueError) as ctx:
            f("classification").within("7d")
        msg = str(ctx.exception)
        self.assertIn("'classification'", msg)
        self.assertIn("'keyword'", msg)

    def test_date_field_rejects_in(self):
        with self.assertRaises(ValueError) as ctx:
            f("last_seen").in_("7d")
        msg = str(ctx.exception)
        self.assertIn("'last_seen'", msg)
        self.assertIn("'date'", msg)

    def test_ip_field_rejects_exists(self):
        with self.assertRaises(ValueError):
            f("ip").exists()

    def test_unknown_field(self):
        with self.assertRaises(ValueError) as ctx:
            f("no_such_field")
        self.assertIn("unknown ELQ field", str(ctx.exception))

    def test_bad_relative_time_shape(self):
        with self.assertRaises(ValueError) as ctx:
            f("last_seen").within("soon")
        self.assertIn("invalid relative time", str(ctx.exception))

    def test_empty_combinators_rejected(self):
        with self.assertRaises(ValueError):
            and_()
        with self.assertRaises(ValueError):
            or_()

    def test_empty_in_rejected(self):
        with self.assertRaises(ValueError):
            f("network.port").in_()

    def test_ip_fields_reject_non_ip_values(self):
        # The server's analyzer refuses non-IP values on the ip field, so
        # the builder fails fast instead of emitting a query that would 400.
        for bad in ("198.51.100.999", "not-an-ip", 123):
            with self.assertRaises(ValueError) as ctx:
                f("ip").term(bad)
            self.assertIn("IPv4 address or CIDR", str(ctx.exception))
        with self.assertRaises(ValueError):
            f("ip").in_("198.51.100.7", "bad")
        self.assertEqual(str(f("ip").term("198.51.100.7")), "ip:198.51.100.7")
        self.assertEqual(
            str(f("ip").term("203.0.113.0/24")), "ip:203.0.113.0/24"
        )


if __name__ == "__main__":
    unittest.main()
