# @itwin/eslint-plugin

ESLint plugin with default configuration and custom rules for iTwin.js projects. For best results, use with Typescript 4.1+

## Installation

You'll first need to install [ESLint](http://eslint.org) and `@itwin/eslint-plugin`:

```json
npm i eslint --save-dev
npm i @itwin/eslint-plugin --save-dev
```

## Using with VSCode

In order for VSCode to use the config file as it is set up, add the following setting to the the VSCode settings (in `.vscode/settings.json`):

```json
"eslint.experimental.useFlatConfig": true,
```

## Usage

Create an `eslint.config.js` file at the root of your project. To set up the file, import `@itwin/eslint-plugin`. Then set the file to export an array of configuration files. This will be done differently depending on whether your project uses ESM or CJS.

### ESM
```javascript
import iTwinPlugin from "@itwin/eslint-plugin";
const { iTwinjsRecommendedConfig, jsdocConfig } = iTwinPlugin;

export default [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...jsdocConfig,
  },
];
```
### CJS
```javascript
const { iTwinjsRecommendedConfig, jsdocConfig } = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...jsdocConfig,
  }
];
```

Then configure the rules you want to override, add a section with rules to be overriden and their severity.

```javascript
const { iTwinjsRecommendedConfig, jsdocConfig } = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinjsRecommendedConfig,
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...jsdocConfig,
  }
];
```

## Rules not in recommended configs

To add rules not set in the recommended configurations, add a plugins section with the `@itwin/eslint-plugin` that was imported. Then, add a rules section with the rule that needs to be added and the severity of error for the rule.

### `no-internal` - prevents use of internal/alpha APIs. Example configurations

```javascript
// custom config
const { iTwinjsRecommendedConfig, jsdocConfig } = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinjsRecommendedConfig,
    rules: {
      "@itwin/no-internal": [
        "error",
          {
            "tag": ["internal", "alpha", "beta"]
          }
      ]
    }
  }
];
```

```javascript
// default config
rules: {
  "@itwin/no-internal": "error"
}
// tag is set to ["internal", "alpha"] by default
```

The rule will report an error whenever you use anything marked with one of the tags configured in the `tag` option.
Allowed tags: `internal`, `alpha`, `beta`, `public`.

## Helper commands

### `no-internal-report` - Runs eslint with the `@itwin/no-internal` rule turned on ("error") using a custom formatter that summarizes the output

This can be run using `npx` or from the scripts section of `package.json`:

```json
  "scripts": {
    "no-internal-report": "no-internal-report \"./src/**/*.ts\""
  },

```

This command forwards all arguments to eslint, so it can be further customized as needed. For example, to specify the tags for the `no-internal` rule:

```json
  "scripts": {
    "no-internal-report": "no-internal-report \"['internal','alpha','beta']\" \"src/**/*.ts\""
  },

```
