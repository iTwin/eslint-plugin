# @itwin/eslint-plugin

ESLint plugin with default configuration and custom rules for iTwin.js projects. For best results, use with Typescript 4.1+

## Installation

You'll first need to install [ESLint](http://eslint.org) and `@itwin/eslint-plugin`:

```json
npm i eslint --save-dev
npm i @itwin/eslint-plugin --save-dev
```

## Usage

Create an `eslint.config.js` file at the root of your project. Inside this file, import any of the provided configs and add it to the exported modules:

```javascript
const itwinjsRecommended = require("@itwin/eslint-plugin/dist/configs/itwinjs-recommended");
const itwinJsdoc = require("@itwin/eslint-plugin/dist/configs/jsdoc");

module.exports = [
  itwinjsRecommended,
  itwinJsdoc,
];
```

Then configure the rules you want to override by adding a section with which files to apply the rule overrides to.

```javascript
const itwinjsRecommended = require("@itwin/eslint-plugin/dist/configs/itwinjs-recommended");
const itwinJsdoc = require("@itwin/eslint-plugin/dist/configs/jsdoc");

module.exports = [
  itwinjsRecommended,
  itwinJsdoc,
  {
    "files": [
      "src/test/**/*"
    ],
    "rules": {
      "deprecation/deprecation": "off"
    }
  }
];
```

## Using with VSCode

In order for VSCode to use the config file as it is set up, add the following setting to the the VSCode settings (in `.vscode/settings.json`):

```json
"eslint.experimental.useFlatConfig": true,
```

As a side effect, any additional plugins added in consumer packages won't be loaded. If you want to use another ESLint plugin, there are two options:

1. Submit a PR to add the ESLint plugin (and an accompanying optional configuration) to this package.
2. Add all the plugins used in this package along with the new one to your package's devDependencies and remove the above configuration from settings.json.

## Rules not in recommended configs

### `no-internal` - prevents use of internal/alpha APIs. Example configurations

```json
// custom config
"@itwin/no-internal": [
"error",
  {
    "tag": ["internal", "alpha", "beta"]
  }
]
```

```json
// default config
"@itwin/no-internal": "error"
// tag is set to ["internal", "alpha"] by default
```

The rule will report an error whenever you use anything marked with one of the tags configured in the `tag` option.
Allowed tags: `internal`, `alpha`, `beta`, `public`.

## Helper commands

### `no-internal-report` - Runs eslint with the `@itwin/no-internal` rule turned on ("error") using a custom formatter that summarizes the output

This can be run using `npx` or from the scripts section of `package.json`:

```json
  "scripts": {
    "no-internal-report": "no-internal-report src/**/*.ts*"
  },

```

This command forwards all arguments to eslint, so it can be further customized as needed. For example, to specify the tags for the `no-internal` rule:

```json
  "scripts": {
    "no-internal-report": "no-internal-report -rule '@itwin/no-internal: ['error', { 'tag': [ 'internal', 'alpha', 'beta' ]}]' src/**/*.ts*"
  },

```
