import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import { Command } from 'commander'
import packageJson from './package.json'

interface CliOptions {
  source: string
  target: string
  exclude?: string
}

interface PackageJson {
  dependencies: Record<string, string>
  [key: string]: unknown
}

function parseCliOptions(argv: string[]): CliOptions {
  const program = new Command()

  program
    .version(packageJson.version)
    .requiredOption('-s, --source <source>', 'Source directory or package.json file')
    .requiredOption('-t, --target <target>', 'Target directory or package.json file')
    .option('-e, --exclude <dependencyName>', 'dependencies to be excluded, separated by commas')
    .parse(argv)

  return program.opts<CliOptions>()
}

function resolvePackageJsonPath(inputPath: string): string {
  const absolutePath = path.resolve(process.cwd(), inputPath)
  return path.basename(absolutePath) === 'package.json'
    ? absolutePath
    : path.join(absolutePath, 'package.json')
}

function readPackageJson(filePath: string, label: string): PackageJson {
  const absolutePath = filePath

  if (!fs.existsSync(absolutePath))
    throw new Error(`${label} package.json not found at ${absolutePath}`)

  const content = fs.readFileSync(absolutePath, 'utf8')

  let packageJsonContent: unknown
  try {
    packageJsonContent = JSON.parse(content)
  }
  catch (error) {
    throw new Error(`Invalid JSON in ${label} package.json at ${absolutePath}: ${getErrorMessage(error)}`)
  }

  if (!isPackageJsonWithDependencies(packageJsonContent)) {
    throw new Error(
      `${label} package.json at ${absolutePath} must define a dependencies object`,
    )
  }

  return packageJsonContent
}

function writePackageJson(filePath: string, content: object): void {
  fs.writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`)
}

function isPackageJsonWithDependencies(value: unknown): value is PackageJson {
  return typeof value === 'object'
    && value !== null
    && 'dependencies' in value
    && typeof value.dependencies === 'object'
    && value.dependencies !== null
    && !Array.isArray(value.dependencies)
}

function parseExcludedPackages(exclude?: string): string[] {
  return exclude
    ?.split(',')
    .map(dep => dep.trim())
    .filter(Boolean) ?? []
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function syncPackageJsonVersions(sourcePath: string, targetPath: string, exclude?: string): void {
  const sourcePackageJson = readPackageJson(sourcePath, 'Source')
  const targetPackageJson = readPackageJson(targetPath, 'Target')

  let isUpdated = false

  const excludedPackages = parseExcludedPackages(exclude)

  Object.keys(sourcePackageJson.dependencies).forEach((dep) => {
    if (excludedPackages.includes(dep))
      return
    if (!(dep in targetPackageJson.dependencies))
      return
    if (sourcePackageJson.dependencies[dep] !== targetPackageJson.dependencies[dep]) {
      targetPackageJson.dependencies[dep] = sourcePackageJson.dependencies[dep]
      isUpdated = true
    }
  })

  if (isUpdated) {
    writePackageJson(targetPath, targetPackageJson)
    console.log('package.json has been synchronized successfully.')
  }
  else {
    console.log('package.json is already up to date.')
  }
}

export async function main(argv = process.argv): Promise<void> {
  try {
    const { source, target, exclude } = parseCliOptions(argv)
    syncPackageJsonVersions(
      resolvePackageJsonPath(source),
      resolvePackageJsonPath(target),
      exclude,
    )
  }
  catch (error) {
    console.error(`Error: ${getErrorMessage(error)}`)
    process.exitCode = 1
  }
}
