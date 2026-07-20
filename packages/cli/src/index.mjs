import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { diffMotion, stableStringify } from '../../motion-ir/src/index.mjs';
import { lintMotion, parseMotion } from '../../parser/src/index.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function readInput(path) {
  if (path === '-') return readFileSync(0, 'utf8');
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

function option(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  if (!args[index + 1]) throw new Error(`${name} requires a value`);
  return args[index + 1];
}

function help() {
  return `motionmd <command> [options]

Commands:
  lint <file|->              Validate MOTION.md and emit JSON findings
  parse <file|->             Emit stable parsed document and Motion IR
  diff <before> <after>      Compare normalized Motion IR and prose
  spec [--format markdown|json]
                             Emit the specification or JSON Schema
`;
}

function emit(io, value) {
  io.stdout.write(typeof value === 'string' ? value : `${stableStringify(value)}\n`);
}

export function run(argv, io = { stdout: process.stdout, stderr: process.stderr }) {
  const [command, ...args] = argv;
  try {
    if (!command || command === 'help' || command === '--help' || command === '-h') {
      emit(io, help());
      return 0;
    }

    if (command === 'lint' || command === 'parse') {
      const path = args.find((arg) => !arg.startsWith('--'));
      if (!path) throw new Error(`${command} requires a file path or -`);
      const source = readInput(path);
      const result = command === 'lint' ? lintMotion(source) : parseMotion(source);
      emit(io, result);
      return result.summary.errors > 0 ? 1 : 0;
    }

    if (command === 'diff') {
      const paths = args.filter((arg) => !arg.startsWith('--'));
      if (paths.length !== 2) throw new Error('diff requires before and after file paths');
      const before = parseMotion(readInput(paths[0]));
      const after = parseMotion(readInput(paths[1]));
      if (before.summary.errors || after.summary.errors) {
        emit(io, {
          error: 'Both documents must be valid before semantic diffing.',
          before: before.summary,
          after: after.summary,
          findings: { before: before.findings, after: after.findings },
        });
        return 1;
      }
      const result = diffMotion(before.ir, after.ir);
      emit(io, result);
      return result.breaking ? 1 : 0;
    }

    if (command === 'spec') {
      const format = option(args, '--format', 'markdown');
      if (format === 'markdown') {
        emit(io, readFileSync(resolve(root, 'docs/spec.md'), 'utf8'));
        return 0;
      }
      if (format === 'json') {
        emit(io, JSON.parse(readFileSync(resolve(root, 'schemas/motion.schema.json'), 'utf8')));
        return 0;
      }
      throw new Error('spec --format must be markdown or json');
    }

    throw new Error(`Unknown command: ${command}`);
  } catch (error) {
    io.stderr.write(`${error.message}\n`);
    return 2;
  }
}
