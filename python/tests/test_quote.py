"""Unit tests for the quoting port, mirroring typescript/test/quote.test.ts.

The expectations follow the Search API's canonical printer (NeedsQuoting,
QuoteValue, quoteString) and the lexer's bare shapes, including the subtle
cases: a leading bracket needs quoting but a mid-string "[" does not, while
"]" ends a range bound anywhere.
"""

import unittest

from ellio_elq import needs_quoting, quote_string, quote_value, render_value


class TestNeedsQuoting(unittest.TestCase):
    def test_values_that_must_be_quoted(self):
        for s in [
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
        ]:
            with self.subTest(value=s):
                self.assertTrue(needs_quoting(s))

    def test_values_that_splice_bare(self):
        for s in [
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
        ]:
            with self.subTest(value=s):
                self.assertFalse(needs_quoting(s))


class TestQuoteValue(unittest.TestCase):
    def test_quotes_exactly_the_values_that_need_it(self):
        self.assertEqual(quote_value("mirai"), "mirai")
        self.assertEqual(quote_value("Telnet Bruteforce"), '"Telnet Bruteforce"')
        self.assertEqual(quote_value("AND"), '"AND"')
        self.assertEqual(quote_value('pa"ss'), "'pa\"ss'")


class TestQuoteString(unittest.TestCase):
    def test_single_quotes_values_with_double_quotes_else_double_quotes(self):
        self.assertEqual(quote_string("plain"), '"plain"')
        self.assertEqual(quote_string('pa"ss'), "'pa\"ss'")
        self.assertEqual(quote_string("pa'ss"), "\"pa'ss\"")
        # Both quote characters cannot be represented losslessly; double
        # quotes are the documented fallback.
        self.assertEqual(quote_string("a\"b'c"), '"a"b\'c"')


class TestRenderValue(unittest.TestCase):
    def test_keeps_lexer_bare_shapes_bare_and_quotes_plain_strings(self):
        self.assertEqual(render_value("malicious"), '"malicious"')
        self.assertEqual(render_value(True), "true")
        self.assertEqual(render_value("true"), "true")
        self.assertEqual(render_value(23), "23")
        self.assertEqual(render_value("23"), "23")
        self.assertEqual(render_value("-1.5"), "-1.5")
        # Integral floats render like ints so both SDKs emit the same text.
        self.assertEqual(render_value(50.0), "50")
        self.assertEqual(render_value("198.51.100.7"), "198.51.100.7")
        self.assertEqual(render_value("203.0.113.0/24"), "203.0.113.0/24")
        self.assertEqual(render_value("2026-06-01"), "2026-06-01")
        self.assertEqual(
            render_value("2026-06-15T12:00:00+02:00"), "2026-06-15T12:00:00+02:00"
        )
        self.assertEqual(render_value("7d"), "7d")
        self.assertEqual(render_value("07d"), "7d")
        # Out-of-range octets and prefixes are not IP shapes; they fall back
        # to quoted strings exactly like the server treats them as words.
        self.assertEqual(render_value("198.51.100.999"), '"198.51.100.999"')
        self.assertEqual(render_value("203.0.113.0/33"), '"203.0.113.0/33"')
        self.assertEqual(render_value("*.example.com"), '"*.example.com"')


if __name__ == "__main__":
    unittest.main()
