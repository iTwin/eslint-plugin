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

export default [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.jsdocConfig,
  },
];
```
### CJS
```javascript
const iTwinPlugin = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.jsdocConfig,
  }
];
```

Then configure the rules you want to override, add a section with rules to be overriden and their severity.

```javascript
const iTwinPlugin = require("@itwin/eslint-plugin");

module.exports = [
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.iTwinjsRecommendedConfig,
  },
  {
    files: ["**/*.{ts,tsx}"],
    ...iTwinPlugin.configs.jsdocConfig,
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    }
  }
];
```

## Rules not in recommended configs

To add rules not set in the recommended configurations, add a plugins section with the `@itwin/eslint-plugin` that was imported. Then, add a rules section with the rule that needs to be added and the severity of error for the rule. 

If a configuration that defines the language parsing options is not used, add a `languageOptions` object. Below is an example of using the `@itwin/no-internal` rule where we define the language options to parse typescript.

### `no-internal` - prevents use of internal/alpha APIs. Example configurations

```javascript
// custom config
const iTwinPlugin = require("@itwin/eslint-plugin");

module.exports = [
  {
    languageOptions: {
      sourceType: "module",
      parser: require("@typescript-eslint/parser"),
      parserOptions: {
        project: "tsconfig.json",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
          modules: true
        },
      },
    },
    plugins: {
      "@itwin": iTwinPlugin
    },
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@itwin/no-internal": "error",
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
    "no-internal-report": "no-internal-report src/**/*.ts*"
  },

```

This command forwards all arguments to eslint, so it can be further customized as needed. For example, to specify the tags for the `no-internal` rule:

```json
  "scripts": {
    "no-internal-report-tag": "no-internal-report \"['internal','alpha','beta']\" src/**/*.ts*"
  },

```
