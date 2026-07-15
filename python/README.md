<p align="center">
  <img src="https://raw.githubusercontent.com/ELLIO-Technology/elq/main/assets/ellio-logo.svg" alt="ELLIO" height="36">
</p>

# ellio-elq

Query builder for ELQ, the query language of the ELLIO Search API. Field
metadata and operator capabilities are generated from the Search API field
catalog; an operator a field's type does not support raises `ValueError`
naming the field, its type, and the allowed operators. No dependencies;
Python 3.10+.

## Install

```
pip install ellio-elq
```

## Usage

```python
from ellio_elq import and_, f, not_, or_

query = and_(
    or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
    not_(f("spoofable").term(True)),
    f("network.port").in_(22, 23),
).build()
# (src.geo.country.code:"CN" OR src.geo.country.code:"RU") AND NOT spoofable:true AND network.port IN (22, 23)

f("last_seen").within("7d").build()      # last_seen:7d
f("ip").term("203.0.113.0/24").build()   # ip:203.0.113.0/24
```

Operators map to methods: `term` (`:`), `not_term` (`!:`), `match` (`~:`),
`not_match` (`!~:`), `eq`/`ne`/`gt`/`gte`/`lt`/`lte`, `in_`,
`range` (`[a TO b]`), `exists`, `not_exists`, and `within` for relative
time windows on date fields.

The builder emits the canonical text form produced by the Search API's
query printer: string values are quoted (single quotes when the value
contains a double quote; ELQ has no escape sequences), while numbers,
booleans, IPs, CIDRs, dates, and relative times stay bare. Parentheses
appear exactly where mixed AND/OR precedence requires them. Invalid
combinations fail early: unsupported operators and non-IP values on the
`ip` field raise `ValueError`. `raw()` is the escape hatch for query text
the builder cannot express; it is parenthesized when composed.


More of the surface:

```python
# Time windows, ranges, and comparisons
f("last_seen").within("7d")                         # last_seen:7d
f("first_seen").range("2026-06-01", "2026-06-30")   # first_seen:[2026-06-01 TO 2026-06-30]
f("active_days").gt(30)                             # active_days > 30

# Presence, analysed-text match, wildcards
f("cve").exists()                                   # cve exists
f("http.user_agent").match("zgrab")                 # http.user_agent~:"zgrab"
f("rdns").term("*.censys-scanner.com")              # rdns:"*.censys-scanner.com"
```

## Query the Search API

The built string goes into the `q` parameter:

```python
import os
import requests

res = requests.get(
    "https://api.ellio.tech/v1/cti/search",
    params={"q": query},
    headers={"apikey": os.environ["ELLIO_API_KEY"]},
)
```

## The language

The full ELQ reference (operators, bare indicators, every searchable field)
lives at https://docs.ellio.tech/threat-intel/elq. Built queries go into
the `q` parameter of the Search API endpoints.

## Conformance

The test suite includes a cross-language conformance table shared with the
TypeScript SDK (`@ellio_tech/elq`): both SDKs must produce byte-identical output
for every case, and each expected string is verified against the server
grammar before release.
