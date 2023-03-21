# Contributing to Contributing to iTwin ESLint Plugin

Welcome to the iTwin ESLint Plugin repository! We appreciate your interest in contributing to the project. Please take a moment to review this document before submitting any contributions.

## Reporting Issues

Have you identified a reproducible problem in iTwin ESLint Plugin?
Have a feature request?
We want to hear about it!
Here's how you can make reporting your issue as effective as possible.

### Look For an Existing Issue

Before you create a new issue, please do a search in [open issues](https://github.com/iTwin/eslint-plugin/issues) to see if the issue or feature request has already been filed.

If you find that your issue already exists, please add relevant comments and your [reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments).
Use a reaction in place of a "+1" comment:

- 👍 - upvote
- 👎 - downvote

If you cannot find an existing issue that describes your bug or feature, create a new issue using the guidelines below.

### Writing Good Bug Reports and Feature Requests

File a single issue per problem and feature request.
Do not enumerate multiple bugs or feature requests in the same issue.

Do not add your issue as a comment to an existing issue unless it's for the identical input.
Many issues look similar, but have different causes.

The more information you can provide, the more likely someone will be successful reproducing the issue and finding a fix.

Please include the following with each issue:

- A short description of the issue that becomes the title
- Versions of relevant iTwin.js packages
- Minimal steps to reproduce the issue or a code snippet that demonstrates the issue
- What you expected to see, versus what you actually saw
- Images that help explain the issue
- Any relevant error messages, logs, or other details
- Impact of the issue
- Use the [`bug`](https://github.com/iTwin/itwinjs-core/labels/bug) or [`enhancement`](https://github.com/iTwin/itwinjs-core/labels/enhancement) label to identify the type of issue you are filing

Don't feel bad if the developers can't reproduce the issue right away.
They will simply ask for more information!

### Follow Your Issue

You may be asked to clarify things or try different approaches, so please follow your issue and be responsive.

## Contributions

We'd love to accept your contributions to iTwin ESLint Plugin.
There are just a few guidelines you need to follow.

### Contributor License Agreement (CLA)

A [Contribution License Agreement with Bentley](https://gist.github.com/imodeljs-admin/9a071844d3a8d420092b5cf360e978ca) must be signed before your contributions will be accepted. Upon opening a pull request, you will be prompted to use [cla-assistant](https://cla-assistant.io/) for a one-time acceptance applicable for all Bentley projects.
You can read more about [Contributor License Agreements](https://en.wikipedia.org/wiki/Contributor_License_Agreement) on Wikipedia.

### Pull Requests

All submissions go through a review process.
We use GitHub pull requests for this purpose.
Consult [GitHub Help](https://help.github.com/articles/about-pull-requests/) for more information on using pull requests.

### Types of Contributions

We welcome contributions, large or small, including:

- Bug fixes
- New features
- Documentation corrections or additions
- Example code snippets
- Sample data

## Using beachball

This repo uses [beachball](https://github.com/microsoft/beachball) for versioning and publishing. 
```
pnpm change
```
This command will prompt you to select the packages that have changed and the new version numbers. It will also update the package dependencies and create a changelog file. 
```
pnpm version-bump
```
This command will show the current version of the packages. 
```
pnpm publish-packages
```
This command will publish the changed packages to the registry. 

Note: For pre releases, please use the `pnpm version-bump-dev` and `pnpm publish-packages-dev` commands.



Thank you for taking the time to contribute to open source and making great projects like iTwin ESLint Plugin possible!
