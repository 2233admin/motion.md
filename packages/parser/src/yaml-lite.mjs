export class YamlLiteError extends Error {
  constructor(message, line) {
    super(line ? `${message} at line ${line}` : message);
    this.name = 'YamlLiteError';
    this.line = line;
  }
}

function stripComment(input) {
  let single = false;
  let double = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (double && character === '\\' && !escaped) {
      escaped = true;
      continue;
    }
    if (character === '"' && !single && !escaped) double = !double;
    if (character === "'" && !double) single = !single;
    if (character === '#' && !single && !double && (index === 0 || /\s/.test(input[index - 1]))) {
      return input.slice(0, index).trimEnd();
    }
    escaped = false;
  }
  return input.trimEnd();
}

function splitPair(content, line) {
  let single = false;
  let double = false;
  let depth = 0;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '"' && !single && content[index - 1] !== '\\') double = !double;
    if (character === "'" && !double) single = !single;
    if (!single && !double) {
      if (character === '[' || character === '{') depth += 1;
      if (character === ']' || character === '}') depth -= 1;
      if (character === ':' && depth === 0) {
        const key = content.slice(0, index).trim();
        if (!key) throw new YamlLiteError('Mapping key cannot be empty', line);
        return [parseKey(key, line), content.slice(index + 1).trim()];
      }
    }
  }
  throw new YamlLiteError('Expected a mapping entry', line);
}

function parseKey(value, line) {
  if (value.startsWith('"')) return parseScalar(value, line);
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'");
  if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(value)) {
    throw new YamlLiteError(`Unsupported mapping key ${value}`, line);
  }
  return value;
}

function parseScalar(value, line) {
  if (value === '' || value === '~' || value === 'null' || value === 'Null' || value === 'NULL') return null;
  if (/^(true|True|TRUE)$/.test(value)) return true;
  if (/^(false|False|FALSE)$/.test(value)) return false;
  if (/^[-+]?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][-+]?\d+)?$/.test(value)) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new YamlLiteError('Numbers must be finite', line);
    return parsed;
  }
  if (value.startsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new YamlLiteError('Invalid double-quoted string', line);
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'")) throw new YamlLiteError('Unterminated single-quoted string', line);
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.startsWith('[') || value.startsWith('{')) {
    try {
      return JSON.parse(value);
    } catch {
      throw new YamlLiteError('Inline collections must use JSON syntax', line);
    }
  }
  if (/^(?:[!&*]|<<:|\||>)/.test(value) || /\s(?:[!&*][A-Za-z0-9_-]+)/.test(value)) {
    throw new YamlLiteError('YAML tags, anchors, aliases, merge keys, and block scalars are not supported', line);
  }
  return value;
}

function tokenize(source) {
  const tokens = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  lines.forEach((original, index) => {
    if (/\t/.test(original)) throw new YamlLiteError('Tabs are not allowed for indentation', index + 1);
    const indent = original.match(/^ */)[0].length;
    const content = stripComment(original.slice(indent));
    if (!content.trim()) return;
    if (/^(%YAML|%TAG|---|\.\.\.)/.test(content)) {
      throw new YamlLiteError('YAML directives and multi-document streams are not supported', index + 1);
    }
    tokens.push({ indent, content, line: index + 1 });
  });
  return tokens;
}

function parseMap(tokens, start, indent) {
  const result = {};
  let index = start;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.indent < indent) break;
    if (token.indent > indent) throw new YamlLiteError('Unexpected indentation', token.line);
    if (token.content.startsWith('-')) break;

    const [key, rest] = splitPair(token.content, token.line);
    if (Object.hasOwn(result, key)) throw new YamlLiteError(`Duplicate key ${key}`, token.line);
    index += 1;
    if (rest === '') {
      if (index < tokens.length && tokens[index].indent > indent) {
        const nested = parseBlock(tokens, index, tokens[index].indent);
        result[key] = nested.value;
        index = nested.index;
      } else {
        result[key] = null;
      }
    } else {
      result[key] = parseScalar(rest, token.line);
    }
  }
  return { value: result, index };
}

function parseSequence(tokens, start, indent) {
  const result = [];
  let index = start;
  while (index < tokens.length) {
    const token = tokens[index];
    if (token.indent < indent) break;
    if (token.indent > indent) throw new YamlLiteError('Unexpected sequence indentation', token.line);
    if (!token.content.startsWith('-')) break;

    const rest = token.content.slice(1).trimStart();
    index += 1;
    if (rest === '') {
      if (index >= tokens.length || tokens[index].indent <= indent) {
        result.push(null);
      } else {
        const nested = parseBlock(tokens, index, tokens[index].indent);
        result.push(nested.value);
        index = nested.index;
      }
      continue;
    }

    if (/^(?:[A-Za-z][A-Za-z0-9-]*|"[^"]+"|'[^']+')\s*:(?:\s|$)/.test(rest)) {
      const [key, scalar] = splitPair(rest, token.line);
      const item = {};
      item[key] = scalar === '' ? null : parseScalar(scalar, token.line);
      if (index < tokens.length && tokens[index].indent > indent) {
        const nestedIndent = tokens[index].indent;
        const nested = parseMap(tokens, index, nestedIndent);
        Object.assign(item, nested.value);
        index = nested.index;
      }
      result.push(item);
    } else {
      result.push(parseScalar(rest, token.line));
      if (index < tokens.length && tokens[index].indent > indent) {
        throw new YamlLiteError('Scalar sequence item cannot have nested content', tokens[index].line);
      }
    }
  }
  return { value: result, index };
}

function parseBlock(tokens, start, indent) {
  if (tokens[start].content.startsWith('-')) return parseSequence(tokens, start, indent);
  return parseMap(tokens, start, indent);
}

export function parseYaml(source) {
  const trimmed = source.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new YamlLiteError('Invalid JSON-compatible YAML');
    }
  }
  const tokens = tokenize(source);
  if (tokens.length === 0) return {};
  if (tokens[0].indent !== 0) throw new YamlLiteError('Root mapping must start at indentation zero', tokens[0].line);
  const parsed = parseBlock(tokens, 0, 0);
  if (parsed.index !== tokens.length) throw new YamlLiteError('Could not parse complete YAML input', tokens[parsed.index]?.line);
  if (Array.isArray(parsed.value)) throw new YamlLiteError('Front matter root must be a mapping');
  return parsed.value;
}
