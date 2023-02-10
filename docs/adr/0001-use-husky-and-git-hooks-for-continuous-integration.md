# 1. Use Husky and Git Hooks for Continuous Integration

Date: 2023-02-02

## Status

2023-02-02 accepted

## Context

During early development, the team is adopting
["Ship / Show / Ask"](https://martinfowler.com/articles/ship-show-ask.html) as
its collaboration model. In both **Ship** and **Show**, developers will be
pushing changes to `main` directly, or merging without approval of a second
developer.

As a new project, there is no Continuous Integration (CI) solution in place.

## Decision

Use git hooks, managed by [Husky](https://typicode.github.io/husky), to ensure
all code pushed passes tests.

## Consequences

Using Husky allows us to have CI without setting up a CI service, or GitHub
Actions. In the future it will be easy to augment or replace this capability
with something like GitHub Actions, if needed.
