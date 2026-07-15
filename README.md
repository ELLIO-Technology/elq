# ELQ SDKs

Client libraries for ELQ, the query language of the ELLIO Search API:

- [`typescript/`](typescript/): `@ellio_tech/elq` on npm, a typed query builder
  with compile-time operator checking and zero runtime dependencies.
- [`python/`](python/): `ellio-elq` on PyPI, the same builder with runtime
  validation, for Python 3.10+.

Both packages emit canonical ELQ query text for the `q` parameter of the
Search API. The full language reference lives at
https://docs.ellio.tech/threat-intel/elq.

## Cross-language conformance

[`conformance/cases.json`](conformance/cases.json) is the shared contract:
both SDKs must produce byte-identical output for every case, and each
expected string is verified as a canonical fixed point of the server
grammar before it lands here.

## About this repository

This repository is an automated export of the SDK sources; changes land
through ELLIO's internal source of truth and appear on the `stage` branch
as sync commits. `main` only ever advances by fast-forward from `stage`
through the promote workflow, which also tags `vX.Y.Z` and publishes both
packages to npm and PyPI via trusted publishing. Issues and feedback are
welcome.
