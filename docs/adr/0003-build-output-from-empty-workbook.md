# 3. Build output from empty workbook

Date: 2023-02-10

## Status

2023-02-10 accepted

## Context

There are two obvious options for building the properly formatted and formulaed
Excel spreadsheet.

1. Load a template file with formatting and formulas already in place; tool only
   inserts data in the right places.
2. Start with an empty workbook and build the entire thing in the tool.

Building from a template file has certain advantages over building the file from
scratch that might allow us to deliver faster:

- Formatting is mostly built into the template, so we can write less code
- The template delivered by the working group is requirements and partial
  implementation all in one, so deviation is less of a concern
- Certain categories of changes to the template may not require code changes

But there are also disadvantages or uncertainties:

- Handling multiple template versions has new complexities
- Division of responsibility becomes less clear — what is the tool "allowed" to
  modify and not?
- How does the template interact with future implementations, e.g. in-browser or
  Excel Add-In
- When working with templates in the past, @pjohnmeyer has noted some awkward
  "developer ergonomics" when doing so -- keeping track of what to insert where,
  which cells needs to shift up/down, keeping formulas correct, etc.

## Decision

We will take the second approach and build the output from an empty workbook.
@pjohnmeyer spent a few hours trying to add data to the v0.3 template using
ExcelJS, and found that saving the file created output Excel claimed was
"damaged". While this may be caused by an ExcelJS bug that we could
theoretically fix, that investigation could take a while and is best left for
others, or later.

We may still be able to use the template for fetching styles and copying them
into the final workbook.

## Consequences

The main consequence here is that any changes to the location or style of output
will require a new release of tooling. We will consider strategies to mitigate
this as we continue development.
