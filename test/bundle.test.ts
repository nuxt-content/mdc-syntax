import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const packagesDir = fileURLToPath(new URL('../packages', import.meta.url))

interface Package {
  name: string
  dir: string
  main: string
}

// Discover every publishable workspace package (has a name, not private).
const packages: Package[] = readdirSync(packagesDir)
  .map((name) => join(packagesDir, name))
  .filter((dir) => existsSync(join(dir, 'package.json')))
  .map((dir) => {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'))
    return { name: pkg.name, dir, main: pkg.main ?? 'dist/index.js', private: !!pkg.private }
  })
  .filter((pkg): pkg is Package & { private: boolean } => Boolean(pkg.name) && !pkg.private)
  .sort((a, b) => a.name.localeCompare(b.name))

// `postinstall` runs `pnpm stub`, which fills `dist/` with files that just
// re-export from `src/`. Bundle sizes are only meaningful after a real build
// (`pnpm prepack`).

// `npm pack --dry-run --json` reports exactly what would be published (honouring
// the `files` field and `.npmignore`), so we measure the real shipped size.
// Memoised because spawning `npm pack` is slow (~3s) and both tests reuse it.
const packCache = new Map<string, { size: number; unpackedSize: number; entryCount: number }>()
function pack(pkg: Package) {
  let report = packCache.get(pkg.name)
  if (!report) {
    ;[report] = JSON.parse(
      execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: pkg.dir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    )
    packCache.set(pkg.name, report!)
  }
  return report!
}

function roundToKilobytes(bytes: number): string {
  return (bytes / 1024).toFixed(bytes > 100 * 1024 ? 0 : 1) + 'k'
}

describe('package bundle size', { timeout: 60_000 }, () => {
  it('published size of each package', () => {
    const report: Record<string, string> = {}
    for (const pkg of packages) {
      const { unpackedSize, entryCount } = pack(pkg)
      report[pkg.name] = `${roundToKilobytes(unpackedSize)} (${entryCount} files)`
    }

    expect(report).toMatchInlineSnapshot(`
      {
        "@comark/angular": "54.0k (70 files)",
        "@comark/ansi": "36.6k (98 files)",
        "@comark/html": "15.7k (58 files)",
        "@comark/nuxt": "11.8k (58 files)",
        "@comark/react": "36.9k (74 files)",
        "@comark/svelte": "43.9k (82 files)",
        "@comark/vue": "51.7k (78 files)",
        "comark": "358k (146 files)",
      }
    `)
  })

  // Guards against a broken `prepack` shipping an empty or stub-only package.
  it('every package ships a built dist', () => {
    for (const pkg of packages) {
      const { entryCount } = pack(pkg)
      expect(entryCount, `${pkg.name} has no published files`).toBeGreaterThan(0)
    }
  })
})
