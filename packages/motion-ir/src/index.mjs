function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, stableValue(value[key])]),
  );
}

export function stableStringify(value, space = 2) {
  return JSON.stringify(stableValue(value), null, space);
}

function namedRecords(mapping = {}) {
  return Object.entries(mapping)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, value]) => stableValue({ id, ...value }));
}

function extensionsOf(value = {}) {
  return stableValue(
    Object.fromEntries(Object.entries(value).filter(([key]) => key.startsWith('x-'))),
  );
}

const tokenPath = (ref) => ref.slice(1, -1);

// Replace `timing` references with the DESIGN.md values they name. The token path stays on
// the record so adapters and diffs can see where the values came from.
function resolveTimelines(timelines = {}, design) {
  return Object.fromEntries(Object.entries(timelines).map(([id, timeline]) => [id, {
    ...timeline,
    tracks: (timeline.tracks ?? []).map((track) => {
      if (track.timing === undefined || !design) return track;
      const path = tokenPath(track.timing);
      const token = design.tokens.get(path);
      return { ...track, timing: path, curve: path, durationMs: token.durationMs, startMs: (track.startMs ?? 0) + token.delayMs };
    }),
  }]));
}

function resolveDefaults(defaults = {}, design) {
  if (defaults.timing === undefined || !design) return defaults;
  const path = tokenPath(defaults.timing);
  const token = design.tokens.get(path);
  return { ...defaults, timing: path, curve: path, durationMs: token.durationMs, delayMs: token.delayMs };
}

function designCurves(frontmatter, design) {
  if (!design) return [];
  const used = new Set();
  if (frontmatter.defaults?.timing) used.add(tokenPath(frontmatter.defaults.timing));
  for (const timeline of Object.values(frontmatter.timelines ?? {})) {
    for (const track of timeline.tracks ?? []) if (track.timing) used.add(tokenPath(track.timing));
  }
  return [...used].sort().map((path) => stableValue({ id: path, origin: 'design', ...design.tokens.get(path).curve }));
}

export function normalizeMotion(frontmatter, sections = [], design = null) {
  if (!frontmatter) return null;

  return stableValue({
    irVersion: '0.2',
    specification: `motion.md/${frontmatter.version ?? 'unknown'}`,
    document: {
      name: frontmatter.name ?? null,
      description: frontmatter.description ?? null,
      posture: frontmatter.posture ?? null,
    },
    design: design ? { path: design.path, sourceHash: design.sourceHash } : null,
    defaults: resolveDefaults(frontmatter.defaults, design),
    graph: {
      states: namedRecords(frontmatter.states),
      events: namedRecords(frontmatter.events),
      transitions: namedRecords(frontmatter.transitions),
    },
    curves: [...namedRecords(frontmatter.curves), ...designCurves(frontmatter, design)]
      .sort((left, right) => left.id.localeCompare(right.id)),
    timelines: namedRecords(resolveTimelines(frontmatter.timelines, design)),
    policies: {
      reducedMotion: frontmatter.reducedMotion ?? null,
      performance: frontmatter.performance ?? null,
    },
    provenance: [...(frontmatter.provenance ?? [])]
      .map(stableValue)
      .sort((left, right) => String(left.id).localeCompare(String(right.id))),
    intent: {
      omitted: (frontmatter.omitted ?? []).map((entry) => (typeof entry === 'string' ? { section: entry } : entry)),
      sections: sections.map(({ heading, content }) => ({ heading, content })),
    },
    extensions: extensionsOf(frontmatter),
  });
}

function keyedArray(value) {
  return (
    Array.isArray(value) &&
    value.every((item) => isPlainObject(item) && typeof item.id === 'string')
  );
}

function compareValues(before, after, path, changes) {
  if (Object.is(before, after)) return;

  if (keyedArray(before) && keyedArray(after)) {
    const left = new Map(before.map((item) => [item.id, item]));
    const right = new Map(after.map((item) => [item.id, item]));
    for (const id of [...new Set([...left.keys(), ...right.keys()])].sort()) {
      compareValues(left.get(id), right.get(id), `${path}/${id}`, changes);
    }
    return;
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const length = Math.max(before.length, after.length);
    for (let index = 0; index < length; index += 1) {
      compareValues(before[index], after[index], `${path}/${index}`, changes);
    }
    return;
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
    for (const key of keys) compareValues(before[key], after[key], `${path}/${key}`, changes);
    return;
  }

  if (before === undefined) {
    changes.added.push({ path, value: stableValue(after) });
  } else if (after === undefined) {
    changes.removed.push({ path, value: stableValue(before) });
  } else {
    changes.modified.push({ path, before: stableValue(before), after: stableValue(after) });
  }
}

function isBreakingChange(change, kind) {
  const path = change.path;
  if (path === '/specification') return true;
  if (kind === 'removed' && /^\/(graph\/(states|events|transitions)|curves|timelines|provenance)\//.test(path)) {
    return true;
  }
  if (
    kind === 'modified' &&
    /^\/graph\/transitions\/[^/]+\/(from|to|on|interruption|cancellation)(\/|$)/.test(path)
  ) {
    return true;
  }
  if (kind === 'removed' && /^\/policies\/reducedMotion\//.test(path)) return true;
  return false;
}

export function diffMotion(before, after) {
  const changes = { added: [], removed: [], modified: [] };
  compareValues(before, after, '', changes);

  const breakingChanges = [
    ...changes.removed.filter((change) => isBreakingChange(change, 'removed')),
    ...changes.modified.filter((change) => isBreakingChange(change, 'modified')),
  ];

  return stableValue({
    breaking: breakingChanges.length > 0,
    summary: {
      added: changes.added.length,
      removed: changes.removed.length,
      modified: changes.modified.length,
      breaking: breakingChanges.length,
    },
    changes,
    breakingChanges,
  });
}
