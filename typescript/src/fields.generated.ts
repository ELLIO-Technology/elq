// Code generated from the ELLIO Search API field catalog; do not edit.

/** Value type names from the fields.yml types block. */
export type TypeName =
  | "bool"
  | "country"
  | "date"
  | "fingerprint"
  | "float"
  | "int"
  | "ip"
  | "keyword"
  | "mitre"
  | "port"
  | "text";

/** Canonical ELQ field names (47 fields). */
export type FieldName =
  | "ip"
  | "classification"
  | "seen"
  | "spoofable"
  | "rdns"
  | "active_days"
  | "last_seen"
  | "first_seen"
  | "network.port"
  | "network.non_spoofable_port"
  | "network.spoofable_port"
  | "src.asn.number"
  | "src.asn.name"
  | "src.geo.country.code"
  | "src.geo.country.name"
  | "src.geo.city"
  | "src.geo.continent.code"
  | "src.geo.continent.name"
  | "src.geo.latitude"
  | "src.geo.longitude"
  | "dst.geo.country.code"
  | "dst.geo.country.name"
  | "dst.geo.city"
  | "dst.geo.continent.code"
  | "dst.geo.continent.name"
  | "dst.geo.latitude"
  | "dst.geo.longitude"
  | "http.path"
  | "http.user_agent"
  | "ssh.auth.username"
  | "ssh.auth.password"
  | "ssh.auth.attempt_count"
  | "ssh.auth.first_seen"
  | "ssh.auth.last_seen"
  | "fingerprints.muonfp"
  | "fingerprints.ja4"
  | "fingerprints.ja4t"
  | "fingerprints.ja4h"
  | "fingerprints.ja4ssh"
  | "fingerprints.ja3"
  | "tag"
  | "tag_id"
  | "actor"
  | "cve"
  | "mitre_attack.tactics"
  | "mitre_attack.techniques"
  | "mitre_attack.sub_techniques";

/** Operator capability of one value type, base chain resolved. */
export interface TypeSpec {
  readonly operators: readonly string[];
  readonly wildcards: boolean;
  readonly relativeTime: boolean;
}

/** One queryable ELQ field as described by the server field catalog. */
export interface FieldMeta {
  readonly name: FieldName;
  readonly type: TypeName;
  readonly category: string;
  readonly description: string;
  readonly aliases: readonly string[];
  readonly enumValues: readonly string[];
  readonly examples: readonly string[];
  readonly caseInsensitive: boolean;
}

/** Field name to type name; the first half of the method gating chain. */
export interface FieldTypeMap {
  readonly "ip": "ip";
  readonly "classification": "keyword";
  readonly "seen": "bool";
  readonly "spoofable": "bool";
  readonly "rdns": "text";
  readonly "active_days": "int";
  readonly "last_seen": "date";
  readonly "first_seen": "date";
  readonly "network.port": "port";
  readonly "network.non_spoofable_port": "port";
  readonly "network.spoofable_port": "port";
  readonly "src.asn.number": "int";
  readonly "src.asn.name": "keyword";
  readonly "src.geo.country.code": "country";
  readonly "src.geo.country.name": "country";
  readonly "src.geo.city": "keyword";
  readonly "src.geo.continent.code": "keyword";
  readonly "src.geo.continent.name": "keyword";
  readonly "src.geo.latitude": "float";
  readonly "src.geo.longitude": "float";
  readonly "dst.geo.country.code": "country";
  readonly "dst.geo.country.name": "country";
  readonly "dst.geo.city": "keyword";
  readonly "dst.geo.continent.code": "keyword";
  readonly "dst.geo.continent.name": "keyword";
  readonly "dst.geo.latitude": "float";
  readonly "dst.geo.longitude": "float";
  readonly "http.path": "text";
  readonly "http.user_agent": "text";
  readonly "ssh.auth.username": "text";
  readonly "ssh.auth.password": "text";
  readonly "ssh.auth.attempt_count": "int";
  readonly "ssh.auth.first_seen": "date";
  readonly "ssh.auth.last_seen": "date";
  readonly "fingerprints.muonfp": "fingerprint";
  readonly "fingerprints.ja4": "fingerprint";
  readonly "fingerprints.ja4t": "fingerprint";
  readonly "fingerprints.ja4h": "fingerprint";
  readonly "fingerprints.ja4ssh": "fingerprint";
  readonly "fingerprints.ja3": "fingerprint";
  readonly "tag": "text";
  readonly "tag_id": "text";
  readonly "actor": "text";
  readonly "cve": "text";
  readonly "mitre_attack.tactics": "mitre";
  readonly "mitre_attack.techniques": "mitre";
  readonly "mitre_attack.sub_techniques": "mitre";
}

/** Type name to the builder methods the type supports; the second half. */
export interface TypeMethodMap {
  readonly "bool": "term" | "notTerm" | "eq" | "ne";
  readonly "country": "term" | "notTerm" | "eq" | "ne" | "in_" | "exists" | "notExists";
  readonly "date": "term" | "eq" | "gt" | "gte" | "lt" | "lte" | "range" | "within";
  readonly "fingerprint": "term" | "notTerm" | "match" | "notMatch" | "eq" | "ne" | "in_" | "exists" | "notExists";
  readonly "float": "term" | "notTerm" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "range";
  readonly "int": "term" | "notTerm" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in_" | "range";
  readonly "ip": "term" | "notTerm" | "eq" | "ne" | "in_" | "range";
  readonly "keyword": "term" | "notTerm" | "eq" | "ne" | "in_" | "exists" | "notExists";
  readonly "mitre": "term" | "notTerm" | "eq" | "ne" | "in_" | "exists" | "notExists";
  readonly "port": "term" | "notTerm" | "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in_" | "range";
  readonly "text": "term" | "notTerm" | "match" | "notMatch" | "eq" | "ne" | "in_" | "exists" | "notExists";
}

export const TYPE_OPERATORS: { readonly [T in TypeName]: TypeSpec } = {
  "bool": { operators: [":", "!:", "=", "!="], wildcards: false, relativeTime: false },
  "country": { operators: [":", "!:", "=", "!=", "IN", "exists", "not_exists"], wildcards: true, relativeTime: false },
  "date": { operators: [":", "=", ">", ">=", "<", "<=", "range"], wildcards: false, relativeTime: true },
  "fingerprint": { operators: [":", "!:", "~:", "!~:", "=", "!=", "IN", "exists", "not_exists"], wildcards: true, relativeTime: false },
  "float": { operators: [":", "!:", "=", "!=", ">", ">=", "<", "<=", "range"], wildcards: false, relativeTime: false },
  "int": { operators: [":", "!:", "=", "!=", ">", ">=", "<", "<=", "IN", "range"], wildcards: false, relativeTime: false },
  "ip": { operators: [":", "!:", "=", "!=", "IN", "range"], wildcards: false, relativeTime: false },
  "keyword": { operators: [":", "!:", "=", "!=", "IN", "exists", "not_exists"], wildcards: true, relativeTime: false },
  "mitre": { operators: [":", "!:", "=", "!=", "IN", "exists", "not_exists"], wildcards: true, relativeTime: false },
  "port": { operators: [":", "!:", "=", "!=", ">", ">=", "<", "<=", "IN", "range"], wildcards: false, relativeTime: false },
  "text": { operators: [":", "!:", "~:", "!~:", "=", "!=", "IN", "exists", "not_exists"], wildcards: true, relativeTime: false },
};

export const FIELDS: { readonly [F in FieldName]: FieldMeta } = {
  "ip": {
    name: "ip",
    type: "ip",
    category: "core",
    description: "IPv4 address of the observed source. Accepts single IPs and CIDR blocks.",
    aliases: [],
    enumValues: [],
    examples: ["ip:\"198.51.100.7\"", "ip:\"203.0.113.0/24\""],
    caseInsensitive: false,
  },
  "classification": {
    name: "classification",
    type: "keyword",
    category: "core",
    description: "ELLIO verdict for the IP.",
    aliases: [],
    enumValues: ["malicious", "promiscuous", "benign", "unknown"],
    examples: ["classification:malicious"],
    caseInsensitive: false,
  },
  "seen": {
    name: "seen",
    type: "bool",
    category: "core",
    description: "Whether the IP was observed by the sensor network in the current window.",
    aliases: [],
    enumValues: ["true", "false"],
    examples: ["seen:true"],
    caseInsensitive: false,
  },
  "spoofable": {
    name: "spoofable",
    type: "bool",
    category: "core",
    description: "True when the IP never completed a TCP handshake (traffic may be spoofed).",
    aliases: [],
    enumValues: ["true", "false"],
    examples: ["spoofable:false"],
    caseInsensitive: false,
  },
  "rdns": {
    name: "rdns",
    type: "text",
    category: "core",
    description: "Reverse DNS name of the IP.",
    aliases: [],
    enumValues: [],
    examples: ["rdns:\"*.example.com\""],
    caseInsensitive: true,
  },
  "active_days": {
    name: "active_days",
    type: "int",
    category: "core",
    description: "Number of days the IP was active in the 91 day window.",
    aliases: [],
    enumValues: [],
    examples: ["active_days > 30"],
    caseInsensitive: false,
  },
  "last_seen": {
    name: "last_seen",
    type: "date",
    category: "temporal",
    description: "Most recent observation. Relative form last_seen:7d means \"within the last 7 days\".",
    aliases: [],
    enumValues: [],
    examples: ["last_seen:1d", "last_seen >= 2026-07-01"],
    caseInsensitive: false,
  },
  "first_seen": {
    name: "first_seen",
    type: "date",
    category: "temporal",
    description: "First observation. Relative form first_seen:30d means \"first seen within the last 30 days\".",
    aliases: [],
    enumValues: [],
    examples: ["first_seen:7d", "first_seen:[2026-06-01 TO 2026-06-30]"],
    caseInsensitive: false,
  },
  "network.port": {
    name: "network.port",
    type: "port",
    category: "network",
    description: "Destination port the IP touched (any handshake state).",
    aliases: ["port"],
    enumValues: [],
    examples: ["network.port:23", "port IN (22, 23, 2323)"],
    caseInsensitive: false,
  },
  "network.non_spoofable_port": {
    name: "network.non_spoofable_port",
    type: "port",
    category: "network",
    description: "Destination port with a completed TCP handshake from this IP.",
    aliases: [],
    enumValues: [],
    examples: ["network.non_spoofable_port:445"],
    caseInsensitive: false,
  },
  "network.spoofable_port": {
    name: "network.spoofable_port",
    type: "port",
    category: "network",
    description: "Destination port seen only without a completed handshake.",
    aliases: [],
    enumValues: [],
    examples: ["network.spoofable_port:53"],
    caseInsensitive: false,
  },
  "src.asn.number": {
    name: "src.asn.number",
    type: "int",
    category: "network",
    description: "Autonomous system number announcing the IP.",
    aliases: ["asn"],
    enumValues: [],
    examples: ["src.asn.number:13335", "AS13335"],
    caseInsensitive: false,
  },
  "src.asn.name": {
    name: "src.asn.name",
    type: "keyword",
    category: "network",
    description: "Name of the announcing autonomous system.",
    aliases: [],
    enumValues: [],
    examples: ["src.asn.name:\"*cloudflare*\""],
    caseInsensitive: true,
  },
  "src.geo.country.code": {
    name: "src.geo.country.code",
    type: "country",
    category: "geolocation",
    description: "ISO 3166-1 alpha-2 country code of the source IP.",
    aliases: ["country"],
    enumValues: [],
    examples: ["src.geo.country.code:US", "country IN (CN, RU)"],
    caseInsensitive: false,
  },
  "src.geo.country.name": {
    name: "src.geo.country.name",
    type: "country",
    category: "geolocation",
    description: "Country name of the source IP.",
    aliases: [],
    enumValues: [],
    examples: ["src.geo.country.name:\"United States\""],
    caseInsensitive: false,
  },
  "src.geo.city": {
    name: "src.geo.city",
    type: "keyword",
    category: "geolocation",
    description: "City of the source IP.",
    aliases: ["city"],
    enumValues: [],
    examples: ["src.geo.city:\"Amsterdam\""],
    caseInsensitive: true,
  },
  "src.geo.continent.code": {
    name: "src.geo.continent.code",
    type: "keyword",
    category: "geolocation",
    description: "Continent code of the source IP.",
    aliases: [],
    enumValues: [],
    examples: ["src.geo.continent.code:EU"],
    caseInsensitive: false,
  },
  "src.geo.continent.name": {
    name: "src.geo.continent.name",
    type: "keyword",
    category: "geolocation",
    description: "Continent name of the source IP.",
    aliases: [],
    enumValues: [],
    examples: ["src.geo.continent.name:Europe"],
    caseInsensitive: false,
  },
  "src.geo.latitude": {
    name: "src.geo.latitude",
    type: "float",
    category: "geolocation",
    description: "Latitude of the source IP geolocation.",
    aliases: [],
    enumValues: [],
    examples: ["src.geo.latitude > 50"],
    caseInsensitive: false,
  },
  "src.geo.longitude": {
    name: "src.geo.longitude",
    type: "float",
    category: "geolocation",
    description: "Longitude of the source IP geolocation.",
    aliases: [],
    enumValues: [],
    examples: ["src.geo.longitude < 0"],
    caseInsensitive: false,
  },
  "dst.geo.country.code": {
    name: "dst.geo.country.code",
    type: "country",
    category: "geolocation",
    description: "Country code of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.country.code:DE"],
    caseInsensitive: false,
  },
  "dst.geo.country.name": {
    name: "dst.geo.country.name",
    type: "country",
    category: "geolocation",
    description: "Country name of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.country.name:Germany"],
    caseInsensitive: false,
  },
  "dst.geo.city": {
    name: "dst.geo.city",
    type: "keyword",
    category: "geolocation",
    description: "City of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.city:\"Prague\""],
    caseInsensitive: true,
  },
  "dst.geo.continent.code": {
    name: "dst.geo.continent.code",
    type: "keyword",
    category: "geolocation",
    description: "Continent code of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.continent.code:EU"],
    caseInsensitive: false,
  },
  "dst.geo.continent.name": {
    name: "dst.geo.continent.name",
    type: "keyword",
    category: "geolocation",
    description: "Continent name of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.continent.name:Europe"],
    caseInsensitive: false,
  },
  "dst.geo.latitude": {
    name: "dst.geo.latitude",
    type: "float",
    category: "geolocation",
    description: "Latitude of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.latitude > 50"],
    caseInsensitive: false,
  },
  "dst.geo.longitude": {
    name: "dst.geo.longitude",
    type: "float",
    category: "geolocation",
    description: "Longitude of sensors this IP targeted.",
    aliases: [],
    enumValues: [],
    examples: ["dst.geo.longitude < 0"],
    caseInsensitive: false,
  },
  "http.path": {
    name: "http.path",
    type: "text",
    category: "http",
    description: "HTTP request path observed from this IP.",
    aliases: ["path"],
    enumValues: [],
    examples: ["http.path:\"/wp-login.php\"", "http.path:\"*.env\""],
    caseInsensitive: true,
  },
  "http.user_agent": {
    name: "http.user_agent",
    type: "text",
    category: "http",
    description: "HTTP User-Agent observed from this IP.",
    aliases: ["ua", "user_agent"],
    enumValues: [],
    examples: ["http.user_agent:\"*zgrab*\""],
    caseInsensitive: true,
  },
  "ssh.auth.username": {
    name: "ssh.auth.username",
    type: "text",
    category: "ssh",
    description: "Username attempted in SSH authentication.",
    aliases: ["username"],
    enumValues: [],
    examples: ["ssh.auth.username:\"root\""],
    caseInsensitive: true,
  },
  "ssh.auth.password": {
    name: "ssh.auth.password",
    type: "text",
    category: "ssh",
    description: "Password attempted in SSH authentication.",
    aliases: ["password"],
    enumValues: [],
    examples: ["ssh.auth.password:\"admin123\""],
    caseInsensitive: true,
  },
  "ssh.auth.attempt_count": {
    name: "ssh.auth.attempt_count",
    type: "int",
    category: "ssh",
    description: "Number of SSH authentication attempts for this credential pair.",
    aliases: [],
    enumValues: [],
    examples: ["ssh.auth.attempt_count > 100"],
    caseInsensitive: false,
  },
  "ssh.auth.first_seen": {
    name: "ssh.auth.first_seen",
    type: "date",
    category: "ssh",
    description: "First observation of this SSH credential pair.",
    aliases: [],
    enumValues: [],
    examples: ["ssh.auth.first_seen:7d"],
    caseInsensitive: false,
  },
  "ssh.auth.last_seen": {
    name: "ssh.auth.last_seen",
    type: "date",
    category: "ssh",
    description: "Most recent observation of this SSH credential pair.",
    aliases: [],
    enumValues: [],
    examples: ["ssh.auth.last_seen:1d"],
    caseInsensitive: false,
  },
  "fingerprints.muonfp": {
    name: "fingerprints.muonfp",
    type: "fingerprint",
    category: "fingerprints",
    description: "MuonFP TCP fingerprint (window_size:tcp_options:mss:window_scale).",
    aliases: ["muonfp"],
    enumValues: [],
    examples: ["fingerprints.muonfp:\"64240:2-4-8-1-3:1460:7\"", "fingerprints.muonfp:\"*:::\""],
    caseInsensitive: false,
  },
  "fingerprints.ja4": {
    name: "fingerprints.ja4",
    type: "fingerprint",
    category: "fingerprints",
    description: "JA4 TLS client fingerprint.",
    aliases: ["ja4"],
    enumValues: [],
    examples: ["fingerprints.ja4:\"t13i190800_9dc949149365_97f8aa674fd9\""],
    caseInsensitive: false,
  },
  "fingerprints.ja4t": {
    name: "fingerprints.ja4t",
    type: "fingerprint",
    category: "fingerprints",
    description: "JA4T TCP fingerprint.",
    aliases: ["ja4t"],
    enumValues: [],
    examples: ["fingerprints.ja4t:\"64240_2-4-8-1-3_1460_7\""],
    caseInsensitive: false,
  },
  "fingerprints.ja4h": {
    name: "fingerprints.ja4h",
    type: "fingerprint",
    category: "fingerprints",
    description: "JA4H HTTP client fingerprint.",
    aliases: ["ja4h"],
    enumValues: [],
    examples: ["fingerprints.ja4h:\"ge11nn15enus_42d7418375b7_000000000000_000000000000\""],
    caseInsensitive: false,
  },
  "fingerprints.ja4ssh": {
    name: "fingerprints.ja4ssh",
    type: "fingerprint",
    category: "fingerprints",
    description: "JA4SSH fingerprint.",
    aliases: ["ja4ssh"],
    enumValues: [],
    examples: ["fingerprints.ja4ssh:\"c36s36_c51s80_c0s0\""],
    caseInsensitive: false,
  },
  "fingerprints.ja3": {
    name: "fingerprints.ja3",
    type: "fingerprint",
    category: "fingerprints",
    description: "JA3 TLS client fingerprint (MD5). Prefer JA4 where available.",
    aliases: ["ja3"],
    enumValues: [],
    examples: ["fingerprints.ja3:\"6734f37431670b3ab4292b8f60f29984\""],
    caseInsensitive: false,
  },
  "tag": {
    name: "tag",
    type: "text",
    category: "intelligence",
    description: "Human-readable behavior tag assigned by the detection pipeline.",
    aliases: [],
    enumValues: [],
    examples: ["tag:\"Telnet Bruteforce\""],
    caseInsensitive: true,
  },
  "tag_id": {
    name: "tag_id",
    type: "text",
    category: "intelligence",
    description: "Stable identifier of the behavior tag.",
    aliases: [],
    enumValues: [],
    examples: ["tag_id:\"telnet_bruteforce\""],
    caseInsensitive: false,
  },
  "actor": {
    name: "actor",
    type: "text",
    category: "intelligence",
    description: "Known actor or scanner attribution (for example internet measurement companies).",
    aliases: [],
    enumValues: [],
    examples: ["actor:\"censys\""],
    caseInsensitive: true,
  },
  "cve": {
    name: "cve",
    type: "text",
    category: "intelligence",
    description: "CVE identifiers associated with exploitation behavior from this IP.",
    aliases: [],
    enumValues: [],
    examples: ["cve:\"CVE-2024-3400\""],
    caseInsensitive: true,
  },
  "mitre_attack.tactics": {
    name: "mitre_attack.tactics",
    type: "mitre",
    category: "intelligence",
    description: "MITRE ATT&CK tactic IDs derived from assigned tags.",
    aliases: ["tactic"],
    enumValues: [],
    examples: ["mitre_attack.tactics:TA0043"],
    caseInsensitive: false,
  },
  "mitre_attack.techniques": {
    name: "mitre_attack.techniques",
    type: "mitre",
    category: "intelligence",
    description: "MITRE ATT&CK technique IDs derived from assigned tags.",
    aliases: ["technique"],
    enumValues: [],
    examples: ["mitre_attack.techniques:T1595"],
    caseInsensitive: false,
  },
  "mitre_attack.sub_techniques": {
    name: "mitre_attack.sub_techniques",
    type: "mitre",
    category: "intelligence",
    description: "MITRE ATT&CK sub-technique IDs derived from assigned tags.",
    aliases: ["sub_technique"],
    enumValues: [],
    examples: ["mitre_attack.sub_techniques:T1595.002"],
    caseInsensitive: false,
  },
};
