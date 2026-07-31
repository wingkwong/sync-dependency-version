import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { test } from 'node:test'

const execFileAsync = promisify(execFile)
const binPath = path.resolve('bin/sync-dependency-version.js')

async function createWorkspace(files) {
  const workspace = await mkdtemp(path.join(tmpdir(), 'sync-dependency-version-'))

  await Promise.all(
    Object.entries(files).map(async ([filePath, content]) => {
      await writePackageJson(path.join(workspace, filePath), content)
    }),
  )

  return workspace
}

async function writePackageJson(filePath, content) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, `${JSON.stringify(content, null, 2)}\n`)
}

async function readPackageJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function runCli(args, cwd) {
  return execFileAsync(process.execPath, [binPath, ...args], { cwd })
}

test('importing the package does not parse CLI arguments', async () => {
  const { main } = await import('../dist/index.mjs')

  assert.equal(typeof main, 'function')
})

test('prints the package version from package.json', async () => {
  const packageJson = await readPackageJson(path.resolve('package.json'))
  const result = await runCli(['--version'], process.cwd())

  assert.equal(result.stdout.trim(), packageJson.version)
})

test('syncs dependency versions from directory inputs', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      dependencies: {
        commander: '^12.0.0',
      },
    },
    'dst/package.json': {
      dependencies: {
        commander: '^11.0.0',
      },
    },
  })

  const result = await runCli(['--source', 'src', '--target', 'dst'], workspace)
  const target = await readPackageJson(path.join(workspace, 'dst/package.json'))

  assert.match(result.stdout, /synchronized successfully/)
  assert.equal(target.dependencies.commander, '^12.0.0')
})

test('syncs dependency versions from direct package.json inputs', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      dependencies: {
        typescript: '^5.3.3',
      },
    },
    'dst/package.json': {
      dependencies: {
        typescript: '^5.0.0',
      },
    },
  })

  await runCli(
    ['--source', 'src/package.json', '--target', 'dst/package.json'],
    workspace,
  )
  const target = await readPackageJson(path.join(workspace, 'dst/package.json'))

  assert.equal(target.dependencies.typescript, '^5.3.3')
})

test('skips dependencies missing from the target package', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      dependencies: {
        commander: '^12.0.0',
        typescript: '^5.3.3',
      },
    },
    'dst/package.json': {
      dependencies: {
        commander: '^11.0.0',
      },
    },
  })

  await runCli(['--source', 'src', '--target', 'dst'], workspace)
  const target = await readPackageJson(path.join(workspace, 'dst/package.json'))

  assert.equal(target.dependencies.commander, '^12.0.0')
  assert.equal(target.dependencies.typescript, undefined)
})

test('does not update excluded dependencies', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      dependencies: {
        commander: '^12.0.0',
        typescript: '^5.3.3',
      },
    },
    'dst/package.json': {
      dependencies: {
        commander: '^11.0.0',
        typescript: '^5.0.0',
      },
    },
  })

  await runCli(
    ['--source', 'src', '--target', 'dst', '--exclude', ' commander , '],
    workspace,
  )
  const target = await readPackageJson(path.join(workspace, 'dst/package.json'))

  assert.equal(target.dependencies.commander, '^11.0.0')
  assert.equal(target.dependencies.typescript, '^5.3.3')
})

test('does not rewrite the target when it is already up to date', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      dependencies: {
        commander: '^12.0.0',
      },
    },
    'dst/package.json': {
      dependencies: {
        commander: '^12.0.0',
      },
    },
  })
  const targetPath = path.join(workspace, 'dst/package.json')
  const before = await stat(targetPath)

  const result = await runCli(['--source', 'src', '--target', 'dst'], workspace)
  const after = await stat(targetPath)

  assert.match(result.stdout, /already up to date/)
  assert.equal(after.mtimeMs, before.mtimeMs)
})

test('exits non-zero with a useful error when a package file is missing', async () => {
  const workspace = await createWorkspace({
    'dst/package.json': {
      dependencies: {
        commander: '^12.0.0',
      },
    },
  })

  await assert.rejects(
    runCli(['--source', 'src', '--target', 'dst'], workspace),
    (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Source package\.json not found/)
      assert.match(error.stderr, /src\/package\.json/)
      return true
    },
  )
})

test('exits non-zero with a useful error for invalid package JSON', async () => {
  const workspace = await createWorkspace({
    'dst/package.json': {
      dependencies: {
        commander: '^12.0.0',
      },
    },
  })
  const sourcePath = path.join(workspace, 'src/package.json')
  await mkdir(path.dirname(sourcePath), { recursive: true })
  await writeFile(sourcePath, '{')

  await assert.rejects(
    runCli(['--source', 'src', '--target', 'dst'], workspace),
    (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Invalid JSON in Source package\.json/)
      return true
    },
  )
})

test('exits non-zero with a useful error when dependencies are missing', async () => {
  const workspace = await createWorkspace({
    'src/package.json': {
      devDependencies: {
        commander: '^12.0.0',
      },
    },
    'dst/package.json': {
      dependencies: {
        commander: '^11.0.0',
      },
    },
  })

  await assert.rejects(
    runCli(['--source', 'src', '--target', 'dst'], workspace),
    (error) => {
      assert.equal(error.code, 1)
      assert.match(error.stderr, /Source package\.json/)
      assert.match(error.stderr, /must define a dependencies object/)
      return true
    },
  )
})
