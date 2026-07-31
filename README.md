# sync-dependency-version

[![NPM version](https://img.shields.io/npm/v/sync-dependency-version.svg)](https://www.npmjs.com/package/sync-dependency-version) [![License](https://img.shields.io/npm/l/sync-dependency-version.svg)](https://github.com/wingkwong/sync-dependency-version/blob/master/LICENSE) [![Total NPM Download](https://img.shields.io/npm/dt/sync-dependency-version.svg)](https://www.npmjs.com/package/sync-dependency-version)

Synchronise dependency versions between package.json files.

## What it does

`sync-dependency-version` copies dependency versions from a source package to a target package.

Only dependencies that already exist in the target package are updated. Dependencies that exist only in the source package are skipped.

## Requirements

- Node.js >= 22.12.0

## Usage

```bash
npx sync-dependency-version \
  --source foo/package.json \
  --target bar/package.json
```

`--source` and `--target` can be either package directories or direct `package.json` file paths.

## Options

| Option | Description |
| --- | --- |
| `-s, --source <source>` | Source directory or `package.json` file |
| `-t, --target <target>` | Target directory or `package.json` file |
| `-e, --exclude <dependencyName>` | Comma-separated dependency names to skip |
| `-V, --version` | Print the CLI version |
| `-h, --help` | Print help |

## Examples

### File Paths

```bash
npx sync-dependency-version \
  --source foo/package.json \
  --target bar/package.json
```

### Directories

```bash
npx sync-dependency-version \
  --source foo \
  --target bar
```

### Exclude Dependencies

```bash
npx sync-dependency-version \
  --source foo/package.json \
  --target bar/package.json \
  --exclude dependencyA,dependencyB,dependencyC
```

## Development

```bash
pnpm install
pnpm run lint
pnpm run typecheck
pnpm test
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
