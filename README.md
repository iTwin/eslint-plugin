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

Create an `eslint.config.js` file at the root of your project. To set up the file, import `@itwin/eslin-plugin`. Then set the file to export an array of configuration files. This will depend on whether your project uses ESM or CJS.

### ESM
```javascript
import eslintPlugin from "@itwin/eslint-plugin";

export default [
  eslintPlugin.configs["itwinjs-recommended"],
  eslintPlugin.configs["jsdoc"],
];
```
### CJS
```javascript
const eslintPlugin = require("@itwin/eslint-plugin");

module.exports = [
  eslintPlugin.configs["itwinjs-recommended"],
  eslintPlugin.configs["jsdoc"],
];
```

Then configure the rules you want to override by adding a section with which files to apply the rule overrides to.

```javascript
const eslintPlugin = require("@itwin/eslint-plugin");

module.exports = [
  eslintPlugin.configs["itwinjs-recommended"],
  eslintPlugin.configs["jsdoc"],
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    }
  }
];
```

## Rules not in recommended configs

To add rules not set in the recommended configurations, add a plugins section with a custom plugin the specifies the rules you would like. To set the error level, specify the severity in the rules section of the configuration. Below is an example of adding the `no-internal` rule.

### `no-internal` - prevents use of internal/alpha APIs. Example configurations

```javascript
// custom config
const eslintPlugin = require("@itwin/eslint-plugin");

module.exports = [
  eslintPlugin.configs["itwinjs-recommended"],
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "@itwin": eslintPlugin
    },
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
