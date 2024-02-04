# sync-dependency-version

[![NPM version](https://img.shields.io/npm/v/sync-dependency-version.svg)](https://www.npmjs.com/package/sync-dependency-version) [![License](https://img.shields.io/npm/l/sync-dependency-version.svg)](https://github.com/wingkwong/sync-dependency-version/blob/master/LICENSE) [![Total NPM Download](https://img.shields.io/npm/dt/sync-dependency-version.svg)](https://www.npmjs.com/package/sync-dependency-version)

Synchronise dependency versions between repositories

## Usage

The dependency versions from the source will be synced to target one if the dependency is found in the target.

```
npx sync-dependency-version --source foo/package.json --target bar/package.json
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
