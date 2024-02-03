import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
import { Command } from 'commander'

const program = new Command()

program
  .version('0.0.1')
  .requiredOption('-s, --source <source>', 'Source directory containing the package.json file')
  .requiredOption('-t, --target <target>', 'Target directory where the package.json file will be synchronized')
  .parse(process.argv)

const { source, target } = program.opts()

function readPackageJson(filePath: string): any {
  const absolutePath = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(absolutePath))
    throw new Error(`package.json not found at ${absolutePath}`)

  const content = fs.readFileSync(absolutePath, 'utf8')
  return JSON.parse(content)
}

function writePackageJson(filePath: string, content: object): any {
  const absolutePath = path.resolve(process.cwd(), filePath)
  fs.writeFileSync(absolutePath, `${JSON.stringify(content, null, 2)}\n`)
}

function syncPackageJsonVersions(sourcePath: string, targetPath: string): void {
  const sourcePackageJson = readPackageJson(sourcePath)
  const targetPackageJson = readPackageJson(targetPath)

  let isUpdated = false

  Object.keys(sourcePackageJson.dependencies).forEach((dep) => {
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

export async function main(): Promise<void> {
  try {
    syncPackageJsonVersions(path.join(source, 'package.json'), path.join(target, 'package.json'))
  }
  catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}