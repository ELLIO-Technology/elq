// ELQ query builder.
//
// Composes field clauses into canonical ELQ query text for the ELLIO
// Search API's q parameter:
//
//   and_(f("classification").term("malicious"), f("network.port").in_(22, 23))
//
// Each field handle exposes only the operators its type supports, enforced
// at compile time; runtime checks mirror the types for plain-JavaScript
// callers. The Python SDK (ellio-elq) produces identical output for the
// same expressions, enforced by a shared conformance suite.

import {
  FIELDS,
  FieldMeta,
  FieldName,
  FieldTypeMap,
  TYPE_OPERATORS,
  TypeMethodMap,
  TypeSpec,
} from "./fields.generated";
import { isIPValue, normalizeRelativeTime, renderValue } from "./quote";

/** Scalar value accepted in clause positions. */
export type Value = string | number | boolean;

/** A composable query fragment; build() or toString() emits the ELQ text. */
export abstract class Expr {
  abstract render(): string;

  build(): string {
    return this.render();
  }

  toString(): string {
    return this.render();
  }
}

// A clause is atomic once rendered: values are validated and quoted at
// construction time, so composition never has to re-inspect them.
class Clause extends Expr {
  constructor(private readonly text: string) {
    super();
  }

  render(): string {
    return this.text;
  }
}

class AndExpr extends Expr {
  constructor(readonly children: readonly Expr[]) {
    super();
  }

  render(): string {
    // OR binds looser than AND, so an OR child needs parentheses to keep
    // its grouping; raw fragments have unknown precedence and are always
    // parenthesized when composed.
    return this.children
      .map((c) => (c instanceof OrExpr || c instanceof RawExpr ? "(" + c.render() + ")" : c.render()))
      .join(" AND ");
  }
}

class OrExpr extends Expr {
  constructor(readonly children: readonly Expr[]) {
    super();
  }

  render(): string {
    // AND and NOT both bind tighter than OR, so only raw fragments need
    // parentheses here.
    return this.children
      .map((c) => (c instanceof RawExpr ? "(" + c.render() + ")" : c.render()))
      .join(" OR ");
  }
}

class NotExpr extends Expr {
  constructor(readonly child: Expr) {
    super();
  }

  render(): string {
    const needsParens =
      this.child instanceof AndExpr || this.child instanceof OrExpr || this.child instanceof RawExpr;
    return "NOT " + (needsParens ? "(" + this.child.render() + ")" : this.child.render());
  }
}

class RawExpr extends Expr {
  constructor(private readonly text: string) {
    super();
  }

  render(): string {
    return this.text;
  }
}

/** ANDs the expressions; a single argument passes through unchanged. */
export function and_(...exprs: Expr[]): Expr {
  return combine(exprs, AndExpr, "and_");
}

/** ORs the expressions; a single argument passes through unchanged. */
export function or_(...exprs: Expr[]): Expr {
  return combine(exprs, OrExpr, "or_");
}

/** Negates the expression, parenthesizing composite children. */
export function not_(expr: Expr): Expr {
  return new NotExpr(expr);
}

/**
 * Escape hatch for query text the builder cannot express. The fragment is
 * emitted verbatim standalone and parenthesized when composed, because its
 * precedence is unknown to the builder.
 */
export function raw(query: string): Expr {
  return new RawExpr(query);
}

function combine(
  exprs: Expr[],
  ctor: new (children: readonly Expr[]) => Expr,
  name: string
): Expr {
  if (exprs.length === 0) {
    throw new Error(name + "() requires at least one expression");
  }
  if (exprs.length === 1) {
    return exprs[0];
  }
  // Same-combinator children flatten: and_(a, and_(b, c)) parses back to
  // the same tree as and_(a, b, c), so the nesting carries no meaning.
  const flat: Expr[] = [];
  for (const e of exprs) {
    if (e instanceof ctor && (e instanceof AndExpr || e instanceof OrExpr)) {
      flat.push(...e.children);
    } else {
      flat.push(e);
    }
  }
  return new ctor(flat);
}

/**
 * All field operations. Handles returned by f() are narrowed to the subset
 * their field's type supports (FieldHandle); the runtime checks mirror that
 * narrowing for plain-JavaScript callers.
 */
export class FieldOps {
  private readonly spec: TypeSpec;

  constructor(private readonly meta: FieldMeta) {
    this.spec = TYPE_OPERATORS[this.meta.type];
  }

  /**
   * Renders one clause value. ip-typed fields reject anything that is not
   * an IPv4 address or CIDR block: the server's analyzer refuses such
   * clauses, so quoting them would only defer the error to a 400.
   */
  private value(v: Value): string {
    if (this.meta.type === "ip" && (typeof v !== "string" || !isIPValue(v))) {
      throw new Error(
        "field " + this.meta.name + " expects an IPv4 address or CIDR block, got " + JSON.stringify(v)
      );
    }
    return renderValue(v);
  }

  /** field:value */
  term(value: Value): Expr {
    this.require(":");
    return new Clause(this.meta.name + ":" + this.value(value));
  }

  /** field!:value */
  notTerm(value: Value): Expr {
    this.require("!:");
    return new Clause(this.meta.name + "!:" + this.value(value));
  }

  /** field~:value (match on the analyzed field) */
  match(value: Value): Expr {
    this.require("~:");
    return new Clause(this.meta.name + "~:" + this.value(value));
  }

  /** field!~:value */
  notMatch(value: Value): Expr {
    this.require("!~:");
    return new Clause(this.meta.name + "!~:" + this.value(value));
  }

  /** field = value */
  eq(value: Value): Expr {
    return this.comparison("=", value);
  }

  /** field != value */
  ne(value: Value): Expr {
    return this.comparison("!=", value);
  }

  /** field > value */
  gt(value: Value): Expr {
    return this.comparison(">", value);
  }

  /** field >= value */
  gte(value: Value): Expr {
    return this.comparison(">=", value);
  }

  /** field < value */
  lt(value: Value): Expr {
    return this.comparison("<", value);
  }

  /** field <= value */
  lte(value: Value): Expr {
    return this.comparison("<=", value);
  }

  /** field IN (v1, v2, ...) */
  in_(first: Value, ...rest: Value[]): Expr {
    this.require("IN");
    const items = [first, ...rest].map((v) => this.value(v));
    return new Clause(this.meta.name + " IN (" + items.join(", ") + ")");
  }

  /** field:[lo TO hi]; both bounds are required, the grammar has no
   * open-ended ranges (the parser rejects a missing bound). */
  range(lo: Value, hi: Value): Expr {
    this.require("range");
    return new Clause(this.meta.name + ":[" + this.value(lo) + " TO " + this.value(hi) + "]");
  }

  /** field exists */
  exists(): Expr {
    this.require("exists");
    return new Clause(this.meta.name + " exists");
  }

  /** field not_exists */
  notExists(): Expr {
    this.require("not_exists");
    return new Clause(this.meta.name + " not_exists");
  }

  /** field:7d style relative-time window (date fields only). */
  within(rel: string): Expr {
    if (!this.spec.relativeTime) {
      throw new Error(
        "within() is not valid for field " +
          JSON.stringify(this.meta.name) +
          " (type " +
          JSON.stringify(this.meta.type) +
          "); allowed operators: " +
          this.spec.operators.join(", ")
      );
    }
    const normalized = normalizeRelativeTime(rel);
    if (normalized === null) {
      throw new Error(
        "invalid relative time " + JSON.stringify(rel) + "; expected forms like 7d (units h, d, w, m, y)"
      );
    }
    return new Clause(this.meta.name + ":" + normalized);
  }

  private comparison(op: string, value: Value): Expr {
    this.require(op);
    return new Clause(this.meta.name + " " + op + " " + this.value(value));
  }

  private require(op: string): void {
    if (!this.spec.operators.includes(op)) {
      throw new Error(
        "operator " +
          JSON.stringify(op) +
          " is not valid for field " +
          JSON.stringify(this.meta.name) +
          " (type " +
          JSON.stringify(this.meta.type) +
          "); allowed operators: " +
          this.spec.operators.join(", ")
      );
    }
  }
}

/**
 * The methods of FieldOps a given field actually supports, derived from the
 * generated FieldTypeMap and TypeMethodMap: a bool field handle does not
 * expose gt, a keyword field does not expose within, and so on.
 */
export type FieldHandle<F extends FieldName> = Pick<FieldOps, TypeMethodMap[FieldTypeMap[F]]>;

/** Returns a typed handle for a canonical ELQ field name. */
export function f<F extends FieldName>(name: F): FieldHandle<F> {
  const meta = FIELDS[name];
  // Unknown names cannot pass the FieldName type, but plain-JavaScript
  // callers get the same contract at runtime.
  if (meta === undefined) {
    throw new Error("unknown ELQ field: " + JSON.stringify(name));
  }
  return new FieldOps(meta) as FieldHandle<F>;
}
