## Getting Started

If you have [Node Version Manager][nvm] (`nvm`) installed, you can get started
by running `script/setup` from the root of the repository. You can then verify
your setup is successful by running `script/test`.

The `script` folder follows the ["Scripts to Rule Them All"][scripts] pattern;
for example you should be able to run `script/update` every time you pull new
changes or checkout a different branch.

## Testing

Jest tests are in the `test` folder and can be run via `script/test`, or by
running `npm test`.

## Running the CLI

If you want to run the `ocf2ocx` CLI based on what is in your local code, there
are two ways.

1. `npm run cli` will build the TypeScript and then invoke the build output.
   Note to pass options you will need a `--` to keep `npm` from capturing them;
   e.g.: `npm run cli --version` will give you the version of `npm` you are
   using, `npm run cli -- --version` will output the version of the CLI.
2. `npm link` will make `ocf2ocx` globally available -- but you will need to
   remember to run `npm run build` to apply your updates.

## Development Process

For initial development, we will be using [Ship / Show / Ask][ssa]. Because of
this, CI is fully implemented using [Husky] and Git hooks; `git push` will
trigger a series of steps to ensure that:

1. You are integrating with the latest code on `main`.
2. Tests are passing

## Decisions

We will use https://github.com/phodal/adr to manage and document
[Architecture Decision Records](https://adr.github.io/). This tool is not
included in the package.json as a dependency; you can run using `npx adr`.

<!-- references below -->

[nvm]: https://github.com/nvm-sh/nvm
[scripts]: https://github.com/github/scripts-to-rule-them-all
[ssa]: https://martinfowler.com/articles/ship-show-ask.html
[husky]: https://typicode.github.io/husky
