"""ELQ query builder.

Composes field clauses into canonical ELQ query text for the ELLIO
Search API's ``q`` parameter::

    and_(f("classification").term("malicious"), f("network.port").in_(22, 23))

Each field accepts only the operators its type supports; anything else
raises ValueError naming the field, its type, and the allowed operators.
The TypeScript SDK (@ellio_tech/elq) produces identical output for the same
expressions, enforced by a shared conformance suite.
"""

from __future__ import annotations

from .fields_generated import FIELDS, TYPE_OPERATORS
from .quote import is_ip_value, normalize_relative_time, render_value

__all__ = ["Expr", "Field", "and_", "f", "not_", "or_", "raw"]

Value = str | int | float | bool


class Expr:
    """A composable query fragment; build() or str() emits the ELQ text."""

    def render(self) -> str:
        raise NotImplementedError

    def build(self) -> str:
        return self.render()

    def __str__(self) -> str:
        return self.render()


class _Clause(Expr):
    # A clause is atomic once rendered: values are validated and quoted at
    # construction time, so composition never has to re-inspect them.
    def __init__(self, text: str) -> None:
        self._text = text

    def render(self) -> str:
        return self._text


class _And(Expr):
    def __init__(self, children: tuple[Expr, ...]) -> None:
        self.children = children

    def render(self) -> str:
        # OR binds looser than AND, so an OR child needs parentheses to keep
        # its grouping; raw fragments have unknown precedence and are always
        # parenthesized when composed.
        parts = [
            f"({c.render()})" if isinstance(c, (_Or, _Raw)) else c.render()
            for c in self.children
        ]
        return " AND ".join(parts)


class _Or(Expr):
    def __init__(self, children: tuple[Expr, ...]) -> None:
        self.children = children

    def render(self) -> str:
        # AND and NOT both bind tighter than OR, so only raw fragments need
        # parentheses here.
        parts = [
            f"({c.render()})" if isinstance(c, _Raw) else c.render()
            for c in self.children
        ]
        return " OR ".join(parts)


class _Not(Expr):
    def __init__(self, child: Expr) -> None:
        self.child = child

    def render(self) -> str:
        if isinstance(self.child, (_And, _Or, _Raw)):
            return f"NOT ({self.child.render()})"
        return f"NOT {self.child.render()}"


class _Raw(Expr):
    def __init__(self, text: str) -> None:
        self._text = text

    def render(self) -> str:
        return self._text


def and_(*exprs: Expr) -> Expr:
    """AND the expressions; a single argument passes through unchanged."""
    return _combine(exprs, _And, "and_")


def or_(*exprs: Expr) -> Expr:
    """OR the expressions; a single argument passes through unchanged."""
    return _combine(exprs, _Or, "or_")


def not_(expr: Expr) -> Expr:
    """Negate the expression, parenthesizing composite children."""
    return _Not(expr)


def raw(query: str) -> Expr:
    """Escape hatch for query text the builder cannot express.

    The fragment is emitted verbatim standalone and parenthesized when
    composed, because its precedence is unknown to the builder.
    """
    return _Raw(query)


def _combine(exprs: tuple[Expr, ...], ctor: type, name: str) -> Expr:
    if len(exprs) == 0:
        raise ValueError(f"{name}() requires at least one expression")
    if len(exprs) == 1:
        return exprs[0]
    # Same-combinator children flatten: and_(a, and_(b, c)) parses back to
    # the same tree as and_(a, b, c), so the nesting carries no meaning.
    flat: list[Expr] = []
    for e in exprs:
        if isinstance(e, ctor) and isinstance(e, (_And, _Or)):
            flat.extend(e.children)
        else:
            flat.append(e)
    return ctor(tuple(flat))


class Field:
    """All field operations, validated at runtime against the field's type
    capabilities from the generated catalog metadata."""

    def __init__(self, name: str) -> None:
        meta = FIELDS.get(name)
        if meta is None:
            raise ValueError(f"unknown ELQ field: {name!r}")
        self._meta = meta
        self._spec = TYPE_OPERATORS[meta["type"]]

    def _value(self, value: Value) -> str:
        # ip-typed fields reject anything that is not an IPv4 address or
        # CIDR block: the server's analyzer refuses such clauses, so
        # quoting them would only defer the error to a 400.
        if self._meta["type"] == "ip" and (
            not isinstance(value, str) or not is_ip_value(value)
        ):
            raise ValueError(
                f"field {self._meta['name']!r} expects an IPv4 address "
                f"or CIDR block, got {value!r}"
            )
        return render_value(value)

    def term(self, value: Value) -> Expr:
        """field:value"""
        self._require(":")
        return _Clause(f"{self._meta['name']}:{self._value(value)}")

    def not_term(self, value: Value) -> Expr:
        """field!:value"""
        self._require("!:")
        return _Clause(f"{self._meta['name']}!:{self._value(value)}")

    def match(self, value: Value) -> Expr:
        """field~:value (match on the analyzed field)"""
        self._require("~:")
        return _Clause(f"{self._meta['name']}~:{self._value(value)}")

    def not_match(self, value: Value) -> Expr:
        """field!~:value"""
        self._require("!~:")
        return _Clause(f"{self._meta['name']}!~:{self._value(value)}")

    def eq(self, value: Value) -> Expr:
        """field = value"""
        return self._comparison("=", value)

    def ne(self, value: Value) -> Expr:
        """field != value"""
        return self._comparison("!=", value)

    def gt(self, value: Value) -> Expr:
        """field > value"""
        return self._comparison(">", value)

    def gte(self, value: Value) -> Expr:
        """field >= value"""
        return self._comparison(">=", value)

    def lt(self, value: Value) -> Expr:
        """field < value"""
        return self._comparison("<", value)

    def lte(self, value: Value) -> Expr:
        """field <= value"""
        return self._comparison("<=", value)

    def in_(self, *values: Value) -> Expr:
        """field IN (v1, v2, ...)"""
        self._require("IN")
        if len(values) == 0:
            raise ValueError("in_() requires at least one value")
        items = ", ".join(self._value(v) for v in values)
        return _Clause(f"{self._meta['name']} IN ({items})")

    def range(self, lo: Value, hi: Value) -> Expr:
        """field:[lo TO hi]; both bounds are required, the grammar has no
        open-ended ranges (the parser rejects a missing bound)."""
        self._require("range")
        return _Clause(
            f"{self._meta['name']}:[{self._value(lo)} TO {self._value(hi)}]"
        )

    def exists(self) -> Expr:
        """field exists"""
        self._require("exists")
        return _Clause(f"{self._meta['name']} exists")

    def not_exists(self) -> Expr:
        """field not_exists"""
        self._require("not_exists")
        return _Clause(f"{self._meta['name']} not_exists")

    def within(self, rel: str) -> Expr:
        """field:7d style relative-time window (date fields only)."""
        if not self._spec["relative_time"]:
            allowed = ", ".join(self._spec["operators"])
            raise ValueError(
                f"within() is not valid for field {self._meta['name']!r} "
                f"(type {self._meta['type']!r}); allowed operators: {allowed}"
            )
        normalized = normalize_relative_time(rel)
        if normalized is None:
            raise ValueError(
                f"invalid relative time {rel!r}; expected forms like 7d "
                f"(units h, d, w, m, y)"
            )
        return _Clause(f"{self._meta['name']}:{normalized}")

    def _comparison(self, op: str, value: Value) -> Expr:
        self._require(op)
        return _Clause(f"{self._meta['name']} {op} {self._value(value)}")

    def _require(self, op: str) -> None:
        if op not in self._spec["operators"]:
            allowed = ", ".join(self._spec["operators"])
            raise ValueError(
                f"operator {op!r} is not valid for field {self._meta['name']!r} "
                f"(type {self._meta['type']!r}); allowed operators: {allowed}"
            )


def f(name: str) -> Field:
    """Return a field handle for a canonical ELQ field name."""
    return Field(name)
