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

For initial development, at a high level we will be using [Ship / Show /
Ask][ssa]. (PRs submitted from forks are by definition "Ask".) Because of this,
CI is fully implemented using [Husky] and Git hooks; `git push` will trigger a
series of steps to ensure that:

1. You are integrating with the latest code on `main`.
2. Tests are passing

### Engineering Decisions

We will use https://github.com/phodal/adr to manage and document
[Architecture Decision Records](https://adr.github.io/). This tool is not
included in the package.json as a dependency; you can run using `npx adr`. New
ADRs should always be proposed as "Ask" PRs.

### Feature Development

The features of the OCX spreadsheet are defined by the Law Firm Working Group
via [reference documents][refdocs]. It is up to the developers to interpret
these reference documents and break the work down into features. You can see the
currently scoped feature work on the [project issue tracker][features]. When
defining a new feature, one should first clearly identify the portion of the
spreadsheet in scope. Taking a screenshot and marking what is in scope is an
effective way to do this.

Once the scope is identified, several activities must be performed. Other than
the first and last steps, they are in no particular order -- but you may find
this order easiest.

#### 1. Determine necessary in-tool calculations and document

Look at every cell in the feature. If the cell is an Excel formula, the desired
outcome can generally be ascertained and documented in the GitHub issue. If the
cell is a string or numeric value, however, we need to determine:

1. Which OCF object(s) are involved in the calculation, and
2. What is the algorithm?

Currently we are documenting these in a [Google Document][calcs]; we intend to
move these into GitHub at some point.

> If you are not confident in the answers to these questions, ask for help! It
> will generally be valuable to get buy-in from the Law Firm Working Group if
> there is any uncertainty. Submit a question via the Issue Tracker and add the
> label `law-firm-wg`.

#### 2. Make sure the necessary OCF Files are being processed

The `ocf-package` module is responsible for loading files referenced by the OCF
Manifest File. You should double-check that the necessary files are being
processed.

#### 3. Make sure the necessary OCF Objects are being consumed

The `model` module is responsible for processing the objects defined and
presenting values and calculation interfaces to the `workbook` module.

#### 4. Develop `workbook` changes against Model interfaces.

The `workbook` module defines the interfaces it needs the model to satisfy. It
can be helpful to make these interfaces optional or use Partials to make testing
easier, although this approach is shifting somewhat as we improve our TDD utils
for the workbook.

#### 5. Implement the real model logic

#### 6. Integrate and test end-to-end

<!-- references below -->

[calcs]:
  https://docs.google.com/document/d/19iVTJfJxIMr_gQHzMgSAHR6PhCBFEHg0TahjYc8uOac/edit#heading=h.pffqkccceov6
[features]:
  https://github.com/captable/ocx/issues?q=is%3Aopen+is%3Aissue+label%3Afeature
[husky]: https://typicode.github.io/husky
[nvm]: https://github.com/nvm-sh/nvm
[refdocs]: https://github.com/captable/ocx/wiki#reference-documents
[scripts]: https://github.com/github/scripts-to-rule-them-all
[ssa]: https://martinfowler.com/articles/ship-show-ask.html
