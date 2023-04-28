# Open Cap Table Format -> Excel Conversion Tools

This repository houses the code necessary to convert a set of [Open Cap Table
Format][ocf] files into a standardized "OCX" Excel spreadsheet. The primary
product produced is a command-line tool, `ocf2ocx`, but the underlying
components of this tool are intended to _eventually_ also be directly usable.

## Getting Started

**Prerequisites: Node 16 or higher**

Currently, `ocf2ocx` is not published to any public package repositories. It can
be installed directly from GitHub by running:

    npm install -g https://github.com/captable/ocx

And then run the tool against a folder of OCF JSON files:

    ocf2ocx /path/to/ocf/files

## [Architecture](docs/architecture.md)

## [Development](docs/development.md)

<!-- references below -->

[ocf]: https://open-cap-table-coalition.github.io/Open-Cap-Format-OCF/
