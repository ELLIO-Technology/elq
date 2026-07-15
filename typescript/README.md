# @ellio_tech/elq

Typed query builder for ELQ, the query language of the ELLIO Search API.
Field metadata and operator capabilities are generated from the Search API
field catalog, so a handle returned by `f()` only exposes the operators its
field type supports, checked at compile time. Zero runtime dependencies.

## Install

```
npm install @ellio_tech/elq
```

## Usage

```ts
import { and_, f, not_, or_ } from "@ellio_tech/elq";

const query = and_(
  or_(f("src.geo.country.code").term("CN"), f("src.geo.country.code").term("RU")),
  not_(f("spoofable").term(true)),
  f("network.port").in_(22, 23)
).build();
// (src.geo.country.code:"CN" OR src.geo.country.code:"RU") AND NOT spoofable:true AND network.port IN (22, 23)

f("last_seen").within("7d").build(); // last_seen:7d
f("ip").term("203.0.113.0/24").build(); // ip:203.0.113.0/24
```

Operators map to methods: `term` (`:`), `notTerm` (`!:`), `match` (`~:`),
`notMatch` (`!~:`), `eq`/`ne`/`gt`/`gte`/`lt`/`lte`, `in_`,
`range` (`[a TO b]`), `exists`, `notExists`, and `within` for relative time
windows on date fields.

The builder emits the canonical text form produced by the Search API's
query printer: string values are quoted (single quotes when the value
contains a double quote; ELQ has no escape sequences), while numbers,
booleans, IPs, CIDRs, dates, and relative times stay bare. Parentheses
appear exactly where mixed AND/OR precedence requires them. Invalid
combinations fail early: unsupported operators and unknown field names do
not compile, and non-IP values on the `ip` field throw. `raw()` is the
escape hatch for query text the builder cannot express; it is parenthesized
when composed.

## The language

The full ELQ reference (operators, bare indicators, every searchable field)
lives at https://docs.ellio.tech/threat-intel/elq. Built queries go into
the `q` parameter of the Search API endpoints.

## Conformance

`npm test` includes a cross-language conformance table shared with the
Python SDK (`ellio-elq`): both SDKs must produce byte-identical output for
every case, and each expected string is verified against the server grammar
before release.
