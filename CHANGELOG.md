# Changelog

All notable changes to the "vscode-testbox" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

* * *

## [Unreleased]

## [3.0.0] - 2025-03-24

### Added

- Test Explorer thanks to Mark Drew
- TestBox v6 support
- TestBox BoxLang Support
- ESLinting updated and all JS files linted
- Formatting and code quality updates
- Updated all snippets thanks to Sublime Text snippets
- Updated all GitHub Actions
- Automated snapshots

## [2.0.0] - 2023-06-15

### Added

- TestBox v5 support
- Added default shortcuts for running jump to spec command: `shift+cmd+t`
- Added several new commands to Run your test harness, your bundle and a single spec, with tons of configuration options (Please see readme)
- Linting files for eslint
- File formatting and code quality updates
- Refactoring to a single `testbox` namespace for commands, snippets, etc

### Improved

- The lookup for spec to jump regex was finely tuned and optimized to avoid whitespace lookups, and so much more.

## [1.0.1] - 2020-05-04

### Added

- TestBox 4 support
- Formatting
- More metadata for package.json

## [0.2.0] - 2018-05-23

- Jump to spec lists all describe, it, and other blocks for the current file and gives the user a filterable dropdown to select a test to jump to.

## [0.1.0] - 2017-11-08

- Initial release.
- Converted TestBox and MockBox snippets from <https://github.com/lmajano/cbox-coldbox-sublime>.

[unreleased]: https://github.com/Ortus-Solutions/vscode-testbox/compare/v3.0.0...HEAD
[3.0.0]: https://github.com/Ortus-Solutions/vscode-testbox/compare/6a55a4c5b6cfa0a22c80cbd3d3e4cb7aa761bda0...v3.0.0
