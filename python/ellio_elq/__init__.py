"""ellio-elq: query builder for ELQ, the ELLIO Search API query language.

Field metadata and operator capabilities are generated from the Search API
field catalog; the builder and quoting modules are behavioural twins of the
TypeScript SDK, pinned by a shared conformance suite.
"""

from .builder import Expr, Field, and_, f, not_, or_, raw
from .fields_generated import FIELD_NAMES, FIELDS, TYPE_OPERATORS
from .quote import (
    needs_quoting,
    normalize_relative_time,
    quote_string,
    quote_value,
    render_value,
)

__all__ = [
    "Expr",
    "Field",
    "FIELDS",
    "FIELD_NAMES",
    "TYPE_OPERATORS",
    "and_",
    "f",
    "needs_quoting",
    "normalize_relative_time",
    "not_",
    "or_",
    "quote_string",
    "quote_value",
    "raw",
    "render_value",
]
