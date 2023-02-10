# 2. Use commander for CLI support

Date: 2023-02-03

## Status

2023-02-03 accepted

## Context

One of the interfaces for OCF-to-OCX conversion will be a command-line
interface, `ocf2ocx`. We do not yet know who will use this CLI, or what features
it will need to support long term. We do know it is likely that other web or
desktop interfaces could be built in the future.

## Decision

@pjohnmeyer has selected
[**commander**](https://www.npmjs.com/package/commander) to support the
development of the CLI interface. This decision was based primarily on:

- **Popularity:** Commander came up in several examples I found online, and had
  the most weekly downloads and GitHub stars of the options I evaluated. This
  means finding help online should be easy.
- **Quality of documentation:** The GitHub README and examples are thorough.
- **Simplicity:** Commander brings along no additional dependencies.

### Alternatives considered

Many options were looked at briefly, but these were looked at most closely.

#### https://www.npmjs.com/package/gluegun

More feature-rich than **commander**, has a community maintenance model. People
that like it seem to really like it, but it seems fairly inactive.

#### https://www.npmjs.com/package/oclif

A feature-rich opinionated framework that supports more features than we will
likely ever need. Spinning up a new CLI project from scratch was extremely
simple, but there is _so much going on_. We may want to consider this option in
the future if we need to deal with things like packaging installers or auto-
updating. ( See https://oclif.io/docs/releasing. )

## Consequences

Because commander is a library and not a framework, this decision is easy to
change in the future.
