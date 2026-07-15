// Public API of @ellio_tech/elq. The generated catalog metadata is re-exported
// so consumers can introspect fields without reaching into module paths.

export { Expr, FieldHandle, FieldOps, Value, and_, f, not_, or_, raw } from "./builder";
export {
  needsQuoting,
  normalizeRelativeTime,
  quoteString,
  quoteValue,
  renderValue,
} from "./quote";
export {
  FIELDS,
  FieldMeta,
  FieldName,
  FieldTypeMap,
  TYPE_OPERATORS,
  TypeMethodMap,
  TypeName,
  TypeSpec,
} from "./fields.generated";
