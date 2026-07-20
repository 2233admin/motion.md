const ID = /^[a-z][a-z0-9-]*$/;
const PROPERTY = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;
const ROOT_KEYS = new Set([
  'version', 'name', 'description', 'posture', 'defaults', 'states', 'events', 'curves',
  'timelines', 'transitions', 'reducedMotion', 'performance', 'provenance',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function add(findings, rule, severity, path, message) {
  findings.push({ rule, severity, path, message });
}

function unknownKeys(findings, value, allowed, path) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key) && !/^x-[a-z0-9][a-z0-9-]*$/.test(key)) {
      add(findings, 'unknown-key', 'error', `${path}/${key}`, 'Unknown machine field; extensions must use an x-* key.');
    }
  }
}

function requireObject(findings, value, path) {
  if (!isObject(value)) {
    add(findings, 'type', 'error', path, 'Expected an object.');
    return false;
  }
  return true;
}

function requireString(findings, value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    add(findings, 'type', 'error', path, 'Expected a non-empty string.');
    return false;
  }
  return true;
}

function validateNamedMap(findings, value, path, validateEntry) {
  if (!requireObject(findings, value, path)) return;
  for (const [id, entry] of Object.entries(value)) {
    if (!ID.test(id)) add(findings, 'identifier', 'error', `${path}/${id}`, 'Identifiers must use lower kebab-case.');
    validateEntry(entry, `${path}/${id}`, id);
  }
}

function validateCurve(findings, curve, path) {
  if (!requireObject(findings, curve, path)) return;
  const common = new Set(['type']);
  if (!['linear', 'cubic-bezier', 'steps', 'spring', 'procedural'].includes(curve.type)) {
    add(findings, 'curve-type', 'error', `${path}/type`, 'Unsupported curve type.');
    return;
  }
  if (curve.type === 'linear') unknownKeys(findings, curve, common, path);
  if (curve.type === 'cubic-bezier') {
    unknownKeys(findings, curve, new Set(['type', 'value']), path);
    if (!Array.isArray(curve.value) || curve.value.length !== 4 || curve.value.some((item) => typeof item !== 'number' || !Number.isFinite(item))) {
      add(findings, 'curve-value', 'error', `${path}/value`, 'Cubic bezier value must contain four finite numbers.');
    } else if (curve.value[0] < 0 || curve.value[0] > 1 || curve.value[2] < 0 || curve.value[2] > 1) {
      add(findings, 'curve-value', 'error', `${path}/value`, 'Cubic bezier x control points must be between 0 and 1.');
    }
  }
  if (curve.type === 'steps') {
    unknownKeys(findings, curve, new Set(['type', 'count', 'jump']), path);
    if (!Number.isInteger(curve.count) || curve.count < 1) add(findings, 'curve-value', 'error', `${path}/count`, 'Step count must be a positive integer.');
    if (!['start', 'end', 'none', 'both'].includes(curve.jump)) add(findings, 'curve-value', 'error', `${path}/jump`, 'Invalid step jump position.');
  }
  if (curve.type === 'spring') {
    unknownKeys(findings, curve, new Set(['type', 'mass', 'stiffness', 'damping', 'initialVelocity', 'settle']), path);
    for (const field of ['mass', 'stiffness']) if (!(typeof curve[field] === 'number' && curve[field] > 0)) add(findings, 'spring', 'error', `${path}/${field}`, 'Expected a positive number.');
    if (!(typeof curve.damping === 'number' && curve.damping >= 0)) add(findings, 'spring', 'error', `${path}/damping`, 'Expected a non-negative number.');
    if (!requireObject(findings, curve.settle, `${path}/settle`)) return;
    unknownKeys(findings, curve.settle, new Set(['positionEpsilon', 'velocityEpsilon', 'maxDurationMs']), `${path}/settle`);
    for (const field of ['positionEpsilon', 'velocityEpsilon', 'maxDurationMs']) if (!(typeof curve.settle[field] === 'number' && curve.settle[field] > 0)) add(findings, 'spring-settle', 'error', `${path}/settle/${field}`, 'Expected a positive number.');
  }
  if (curve.type === 'procedural') {
    unknownKeys(findings, curve, new Set(['type', 'generator', 'expression', 'parameters', 'seed', 'sample']), path);
    if (Boolean(curve.generator) === Boolean(curve.expression)) add(findings, 'procedural-source', 'error', path, 'Declare exactly one of generator or expression.');
    if (curve.expression) {
      const banned = /(?:=>|function\b|import\b|require\b|new\b|this\b|[;{}=]|\.[A-Za-z_$])/;
      const allowed = /^[A-Za-z0-9_+\-*/%().,\s]+$/;
      if (banned.test(curve.expression) || !allowed.test(curve.expression)) add(findings, 'executable-content', 'error', `${path}/expression`, 'Expression must use the restricted declarative arithmetic vocabulary.');
      const vocabulary = new Set(['t', 'progress', 'sin', 'cos', 'tan', 'abs', 'min', 'max', 'clamp', 'pow', 'sqrt', 'exp', 'log', ...Object.keys(curve.parameters ?? {})]);
      const identifiers = curve.expression.match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
      for (const identifier of identifiers) if (!vocabulary.has(identifier)) add(findings, 'procedural-vocabulary', 'error', `${path}/expression`, `Unknown procedural identifier: ${identifier}.`);
    }
    if (curve.generator !== undefined && !ID.test(curve.generator)) add(findings, 'identifier', 'error', `${path}/generator`, 'Generator must use lower kebab-case.');
    if (curve.parameters !== undefined && (!isObject(curve.parameters) || Object.values(curve.parameters).some((value) => typeof value !== 'number' || !Number.isFinite(value)))) add(findings, 'procedural-parameters', 'error', `${path}/parameters`, 'Procedural parameters must be finite numbers.');
    if (!requireObject(findings, curve.sample, `${path}/sample`)) return;
    if (!(typeof curve.sample.rateHz === 'number' && curve.sample.rateHz > 0)) add(findings, 'procedural-sample', 'error', `${path}/sample/rateHz`, 'Sample rate must be positive.');
    if (!(Number.isInteger(curve.sample.durationMs) && curve.sample.durationMs > 0)) add(findings, 'procedural-sample', 'error', `${path}/sample/durationMs`, 'Sample duration must be a positive integer.');
    const random = /\b(random|noise|jitter)\b/i.test(`${curve.generator ?? ''} ${curve.expression ?? ''}`);
    if (random && !Number.isInteger(curve.seed)) add(findings, 'procedural-seed', 'error', `${path}/seed`, 'Random procedural motion requires an integer seed.');
  }
}

export function validateMotion(frontmatter, sections) {
  const findings = [];
  if (!frontmatter) {
    add(findings, 'missing-frontmatter', 'warning', '/', 'Document has no machine-readable front matter.');
  } else {
    unknownKeys(findings, frontmatter, ROOT_KEYS, '');
    if (frontmatter.version !== '0.1') add(findings, 'spec-version', 'error', '/version', 'v0.1 documents must declare version "0.1".');
    requireString(findings, frontmatter.name, '/name');
    if (!['static', 'minimal', 'expressive', 'procedural'].includes(frontmatter.posture)) add(findings, 'posture', 'error', '/posture', 'Posture must be static, minimal, expressive, or procedural.');

    const stateIds = new Set(Object.keys(frontmatter.states ?? {}));
    const eventIds = new Set(Object.keys(frontmatter.events ?? {}));
    const curveIds = new Set(Object.keys(frontmatter.curves ?? {}));
    const timelineIds = new Set(Object.keys(frontmatter.timelines ?? {}));
    const transitionIds = new Set(Object.keys(frontmatter.transitions ?? {}));

    if (frontmatter.posture !== 'static') {
      for (const field of ['states', 'events', 'transitions']) {
        if (!isObject(frontmatter[field]) || Object.keys(frontmatter[field]).length === 0) add(findings, 'required-graph', 'error', `/${field}`, `Non-static posture requires at least one ${field} entry.`);
      }
    }

    if (frontmatter.defaults !== undefined && requireObject(findings, frontmatter.defaults, '/defaults')) {
      unknownKeys(findings, frontmatter.defaults, new Set(['durationMs', 'delayMs', 'curve']), '/defaults');
      for (const field of ['durationMs', 'delayMs']) if (frontmatter.defaults[field] !== undefined && (!Number.isInteger(frontmatter.defaults[field]) || frontmatter.defaults[field] < 0)) add(findings, 'time-value', 'error', `/defaults/${field}`, 'Time values must be non-negative integer milliseconds.');
      if (frontmatter.defaults.curve && !curveIds.has(frontmatter.defaults.curve)) add(findings, 'broken-ref', 'error', '/defaults/curve', 'Default curve reference does not exist.');
    }

    if (frontmatter.states !== undefined) validateNamedMap(findings, frontmatter.states, '/states', (state, path) => {
      if (!requireObject(findings, state, path)) return;
      unknownKeys(findings, state, new Set(['description', 'invariants']), path);
      requireString(findings, state.description, `${path}/description`);
      if (state.invariants !== undefined && (!Array.isArray(state.invariants) || state.invariants.some((item) => typeof item !== 'string'))) add(findings, 'type', 'error', `${path}/invariants`, 'Invariants must be an array of strings.');
    });

    if (frontmatter.events !== undefined) validateNamedMap(findings, frontmatter.events, '/events', (event, path) => {
      if (!requireObject(findings, event, path)) return;
      unknownKeys(findings, event, new Set(['description', 'source']), path);
      requireString(findings, event.description, `${path}/description`);
      if (!['user', 'system', 'data', 'time', 'viewport', 'media', 'sensor'].includes(event.source)) add(findings, 'event-source', 'error', `${path}/source`, 'Unsupported event source.');
    });

    if (frontmatter.curves !== undefined) validateNamedMap(findings, frontmatter.curves, '/curves', (curve, path) => validateCurve(findings, curve, path));
    if (frontmatter.posture === 'procedural' && !Object.values(frontmatter.curves ?? {}).some((curve) => curve?.type === 'procedural')) add(findings, 'procedural-posture', 'error', '/curves', 'Procedural posture requires at least one procedural curve.');

    if (frontmatter.timelines !== undefined) validateNamedMap(findings, frontmatter.timelines, '/timelines', (timeline, path) => {
      if (!requireObject(findings, timeline, path)) return;
      unknownKeys(findings, timeline, new Set(['description', 'driver', 'durationMs', 'tracks']), path);
      requireString(findings, timeline.description, `${path}/description`);
      if (!requireObject(findings, timeline.driver, `${path}/driver`) || !['clock', 'scroll', 'pointer', 'media', 'custom'].includes(timeline.driver?.type)) {
        add(findings, 'driver', 'error', `${path}/driver/type`, 'Unsupported timeline driver.');
      } else {
        unknownKeys(findings, timeline.driver, new Set(['type', 'axis', 'range']), `${path}/driver`);
        if (timeline.driver.axis !== undefined && !['x', 'y', 'scalar'].includes(timeline.driver.axis)) add(findings, 'driver', 'error', `${path}/driver/axis`, 'Driver axis must be x, y, or scalar.');
        if (timeline.driver.range !== undefined && (!Array.isArray(timeline.driver.range) || timeline.driver.range.length !== 2 || timeline.driver.range.some((value) => typeof value !== 'number' || !Number.isFinite(value)))) add(findings, 'driver', 'error', `${path}/driver/range`, 'Driver range must contain two finite numbers.');
      }
      if (timeline.durationMs !== undefined && (!Number.isInteger(timeline.durationMs) || timeline.durationMs < 0)) add(findings, 'time-value', 'error', `${path}/durationMs`, 'Timeline duration must be non-negative integer milliseconds.');
      if (!Array.isArray(timeline.tracks) || timeline.tracks.length === 0) {
        add(findings, 'tracks', 'error', `${path}/tracks`, 'Timeline requires at least one track.');
        return;
      }
      timeline.tracks.forEach((track, index) => {
        const trackPath = `${path}/tracks/${index}`;
        if (!requireObject(findings, track, trackPath)) return;
        unknownKeys(findings, track, new Set(['target', 'property', 'curve', 'startMs', 'durationMs', 'keyframes']), trackPath);
        if (!ID.test(track.target ?? '')) add(findings, 'identifier', 'error', `${trackPath}/target`, 'Track target must use lower kebab-case.');
        if (!PROPERTY.test(track.property ?? '')) add(findings, 'property-path', 'error', `${trackPath}/property`, 'Property must be a runtime-neutral dotted path.');
        if (track.curve && !curveIds.has(track.curve)) add(findings, 'broken-ref', 'error', `${trackPath}/curve`, 'Track curve reference does not exist.');
        for (const field of ['startMs', 'durationMs']) if (track[field] !== undefined && (!Number.isInteger(track[field]) || track[field] < 0)) add(findings, 'time-value', 'error', `${trackPath}/${field}`, 'Time values must be non-negative integer milliseconds.');
        if (!Array.isArray(track.keyframes) || track.keyframes.length < 2) {
          add(findings, 'keyframes', 'error', `${trackPath}/keyframes`, 'Track requires at least two keyframes.');
        } else {
          let previous = -Infinity;
          track.keyframes.forEach((keyframe, keyframeIndex) => {
            const at = keyframe?.at;
            if (!isObject(keyframe) || typeof at !== 'number' || at < 0 || at > 1 || !Object.hasOwn(keyframe, 'value')) {
              add(findings, 'keyframe', 'error', `${trackPath}/keyframes/${keyframeIndex}`, 'Keyframe requires at in [0, 1] and a value.');
            } else {
              unknownKeys(findings, keyframe, new Set(['at', 'value']), `${trackPath}/keyframes/${keyframeIndex}`);
            }
            if (typeof at === 'number' && at < previous) add(findings, 'keyframe-order', 'error', `${trackPath}/keyframes/${keyframeIndex}/at`, 'Keyframes must use non-decreasing progress.');
            previous = at;
          });
        }
      });
    });

    if (frontmatter.transitions !== undefined) validateNamedMap(findings, frontmatter.transitions, '/transitions', (transition, path) => {
      if (!requireObject(findings, transition, path)) return;
      unknownKeys(findings, transition, new Set(['description', 'from', 'to', 'on', 'guard', 'timeline', 'mode', 'interruption', 'cancellation']), path);
      if (!stateIds.has(transition.from)) add(findings, 'broken-ref', 'error', `${path}/from`, 'Source state reference does not exist.');
      if (!stateIds.has(transition.to)) add(findings, 'broken-ref', 'error', `${path}/to`, 'Destination state reference does not exist.');
      if (!eventIds.has(transition.on)) add(findings, 'broken-ref', 'error', `${path}/on`, 'Event reference does not exist.');
      if (Boolean(transition.timeline) === Boolean(transition.mode === 'instant')) add(findings, 'transition-mode', 'error', path, 'Declare exactly one of timeline or mode: instant.');
      if (transition.timeline && !timelineIds.has(transition.timeline)) add(findings, 'broken-ref', 'error', `${path}/timeline`, 'Timeline reference does not exist.');
      if (!['reverse', 'replace', 'complete', 'queue', 'ignore'].includes(transition.interruption?.policy)) add(findings, 'interruption', 'error', `${path}/interruption/policy`, 'Transition requires a valid interruption policy.');
      if (!['source', 'target', 'nearest', 'hold'].includes(transition.cancellation?.policy)) add(findings, 'cancellation', 'error', `${path}/cancellation/policy`, 'Transition requires a valid cancellation policy.');
      if (isObject(transition.interruption)) unknownKeys(findings, transition.interruption, new Set(['policy']), `${path}/interruption`);
      if (isObject(transition.cancellation)) unknownKeys(findings, transition.cancellation, new Set(['policy']), `${path}/cancellation`);
      if (transition.interruption?.policy === 'ignore' && frontmatter.events?.[transition.on]?.source === 'user') add(findings, 'ignored-user-input', 'warning', `${path}/interruption/policy`, 'Ignoring direct user input can conceal current intent.');
      if (transition.guard && /(?:=>|function\b|import\b|require\b|[;{}=])/.test(transition.guard)) add(findings, 'executable-content', 'error', `${path}/guard`, 'Guards must be declarative expressions, not executable code.');
    });

    if (!requireObject(findings, frontmatter.reducedMotion, '/reducedMotion')) {
      add(findings, 'required', 'error', '/reducedMotion', 'Reduced-motion policy is required.');
    } else {
      unknownKeys(findings, frontmatter.reducedMotion, new Set(['strategy', 'reason', 'substitutions']), '/reducedMotion');
      if (!['instant', 'substitute', 'preserve'].includes(frontmatter.reducedMotion.strategy)) add(findings, 'reduced-motion', 'error', '/reducedMotion/strategy', 'Invalid reduced-motion strategy.');
      if (frontmatter.reducedMotion.strategy === 'preserve') requireString(findings, frontmatter.reducedMotion.reason, '/reducedMotion/reason');
      if (frontmatter.reducedMotion.strategy === 'substitute') {
        if (requireObject(findings, frontmatter.reducedMotion.substitutions, '/reducedMotion/substitutions')) {
          for (const transitionId of transitionIds) if (!Object.hasOwn(frontmatter.reducedMotion.substitutions, transitionId)) add(findings, 'missing-substitution', 'error', `/reducedMotion/substitutions/${transitionId}`, 'Substitute strategy requires an entry for every transition.');
          for (const [transitionId, substitution] of Object.entries(frontmatter.reducedMotion.substitutions)) {
            const path = `/reducedMotion/substitutions/${transitionId}`;
            if (!transitionIds.has(transitionId)) add(findings, 'broken-ref', 'error', path, 'Reduced-motion substitution references an unknown transition.');
            if (!isObject(substitution) || !['instant', 'crossfade', 'timeline'].includes(substitution.mode)) {
              add(findings, 'reduced-motion', 'error', `${path}/mode`, 'Invalid substitution mode.');
              continue;
            }
            unknownKeys(findings, substitution, new Set(['mode', 'timeline', 'preserves', 'reason']), path);
            const preserved = new Set(['state', 'content', 'focus', 'selection', 'input', 'continuity']);
            if (!Array.isArray(substitution.preserves) || substitution.preserves.length === 0 || substitution.preserves.some((item) => !preserved.has(item))) add(findings, 'reduced-motion-preserves', 'error', `${path}/preserves`, 'Substitution must preserve one or more recognized semantic concerns.');
            if (substitution.mode === 'timeline' && !timelineIds.has(substitution.timeline)) add(findings, 'broken-ref', 'error', `${path}/timeline`, 'Substitution timeline reference does not exist.');
          }
        }
      }
    }

    if (!requireObject(findings, frontmatter.performance, '/performance')) {
      add(findings, 'required', 'error', '/performance', 'Performance policy is required.');
    } else {
      unknownKeys(findings, frontmatter.performance, new Set(['targetFps', 'maxMainThreadMsPerFrame', 'maxConcurrentTracks', 'inputReadyMs', 'allowedProperties', 'forbiddenProperties', 'deterministic']), '/performance');
      if (!Number.isInteger(frontmatter.performance.targetFps) || frontmatter.performance.targetFps < 1 || frontmatter.performance.targetFps > 240) add(findings, 'performance', 'error', '/performance/targetFps', 'targetFps must be an integer from 1 to 240.');
      if (!(typeof frontmatter.performance.maxMainThreadMsPerFrame === 'number' && frontmatter.performance.maxMainThreadMsPerFrame >= 0)) add(findings, 'performance', 'error', '/performance/maxMainThreadMsPerFrame', 'Expected a non-negative number.');
      if (!Number.isInteger(frontmatter.performance.maxConcurrentTracks) || frontmatter.performance.maxConcurrentTracks < 1) add(findings, 'performance', 'error', '/performance/maxConcurrentTracks', 'Expected a positive integer.');
      if (!Number.isInteger(frontmatter.performance.inputReadyMs) || frontmatter.performance.inputReadyMs < 0) add(findings, 'performance', 'error', '/performance/inputReadyMs', 'Expected non-negative integer milliseconds.');
      if (typeof frontmatter.performance.deterministic !== 'boolean') add(findings, 'performance', 'error', '/performance/deterministic', 'Deterministic must be boolean.');
      for (const field of ['allowedProperties', 'forbiddenProperties']) if (frontmatter.performance[field] !== undefined && (!Array.isArray(frontmatter.performance[field]) || frontmatter.performance[field].some((item) => !ID.test(item)))) add(findings, 'performance', 'error', `/performance/${field}`, 'Property classes must be lower kebab-case identifiers.');
    }

    if (!Array.isArray(frontmatter.provenance) || frontmatter.provenance.length === 0) {
      add(findings, 'required', 'error', '/provenance', 'At least one provenance entry is required.');
    } else {
      const seen = new Set();
      frontmatter.provenance.forEach((entry, index) => {
        const path = `/provenance/${index}`;
        if (!requireObject(findings, entry, path)) return;
        unknownKeys(findings, entry, new Set(['id', 'kind', 'description', 'source', 'license']), path);
        if (!ID.test(entry.id ?? '')) add(findings, 'identifier', 'error', `${path}/id`, 'Provenance id must use lower kebab-case.');
        if (seen.has(entry.id)) add(findings, 'duplicate-provenance', 'error', `${path}/id`, 'Provenance ids must be unique.');
        seen.add(entry.id);
        if (!['authored', 'measured', 'derived', 'research'].includes(entry.kind)) add(findings, 'provenance-kind', 'error', `${path}/kind`, 'Invalid provenance kind.');
        requireString(findings, entry.description, `${path}/description`);
        if (entry.kind !== 'authored') requireString(findings, entry.source, `${path}/source`);
        if (entry.license !== undefined) requireString(findings, entry.license, `${path}/license`);
      });
    }
  }

  const canonical = ['Motion Thesis', 'Motion Principles', 'Hierarchy and Choreography', 'Interruption', 'Reduced Motion', 'Performance', 'Provenance'];
  const headings = sections.map((section) => section.heading);
  for (const required of canonical) if (!headings.includes(required)) add(findings, 'missing-section', 'warning', `/sections/${required}`, `Recommended section is missing: ${required}.`);
  let last = -1;
  for (const heading of headings) {
    const position = canonical.indexOf(heading);
    if (position >= 0 && position < last) add(findings, 'section-order', 'warning', `/sections/${heading}`, 'Canonical sections should follow specification order.');
    if (position >= 0) last = position;
  }

  return findings;
}
