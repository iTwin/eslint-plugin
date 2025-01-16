/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const typescriptEslintPlugin = require("@typescript-eslint/eslint-plugin");

module.exports =
{
  languageOptions: require("./utils/language-options"),
  plugins: {
    "@typescript-eslint": typescriptEslintPlugin,
    "import": require("eslint-plugin-import"),
    "prefer-arrow": require("eslint-plugin-prefer-arrow"),
    "@itwin": require("../plugin")
  },
  rules: {
    ...typescriptEslintPlugin.configs["recommended"].rules,
    ...typescriptEslintPlugin.configs["recommended-requiring-type-checking"].rules,
    "@typescript-eslint/adjacent-overload-signatures": "error",
    "@typescript-eslint/array-type": "off", // TODO: May want to turn this on for consistency
    "@typescript-eslint/await-thenable": "error",
    "@typescript-eslint/ban-types": "off",
    // "@typescript-eslint/ban-tslint-comment": "error",
    "@typescript-eslint/class-name-casing": "off",
    "@typescript-eslint/camelcase": "off", // Using @typescript-eslint/naming-convention instead
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/consistent-type-definitions": "error",
    // Checks for return types of all methods so even wants void/Promise<void>.  Do we want to do that?
    // Otherwise we need to use `allowedTypedFunctionExpressions - false`. Could always do this for only tests.
    //
    // They are not going to allow void, at least for now, https://github.com/typescript-eslint/typescript-eslint/issues/50.
    // May want to fork and implement ourselves...
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-member-accessibility": [
      "error",
      {
        "accessibility": "explicit",
        "overrides": {
          "constructors": "off"
        }
      }
    ],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    "@typescript-eslint/member-ordering": "off",
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "default",
        "format": ["camelCase"],
        "leadingUnderscore": "allow",
        "trailingUnderscore": "allow"
      },
      {
        "selector": "variable",
        "format": ["camelCase", "UPPER_CASE"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "memberLike",
        "modifiers": ["static"],
        "format": ["camelCase", "UPPER_CASE"],
      },
      {
        "selector": "memberLike",
        "modifiers": ["static", "public"],
        "format": ["camelCase", "UPPER_CASE"],
      },
      {
        "selector": "memberLike",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "require"
      },
      {
        "selector": "memberLike",
        "modifiers": ["static", "private"],
        "format": ["camelCase", "UPPER_CASE"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "method",
        "modifiers": ["private"],
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "memberLike",
        "modifiers": ["protected"],
        "format": ["camelCase"],
        "leadingUnderscore": "allow"
      },
      {
        "selector": "memberLike",
        "modifiers": ["public"],
        "format": ["camelCase"],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": "typeLike",
        "format": ["PascalCase"],
        "leadingUnderscore": "forbid"
      },
      {
        "selector": ["enumMember", "import"],
        "format": null,
        "leadingUnderscore": "allow"
      },
      {
        "selector": [
          "classProperty",
          "objectLiteralProperty",
          "typeProperty",
          "classMethod",
          "objectLiteralMethod",
          "typeMethod",
          "accessor",
          "enumMember"
        ],
        "format": null,
        "modifiers": ["requiresQuotes"]
      }
    ],
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-implied-eval": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-misused-new": "error",
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        "checksVoidReturn": false
      }
    ],
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/no-parameter-properties": "off",
    "@typescript-eslint/no-redeclare": [
      "error",
      {
        "ignoreDeclarationMerge": true,
      }
    ],
    "@typescript-eslint/no-shadow": [
      "error",
      {
        "hoist": "all",
        "allow": ["T", "args"]
      }
    ],
    "@typescript-eslint/return-await": "error",
    "@typescript-eslint/no-deprecated": "error",
    "@typescript-eslint/no-duplicate-type-constituents": "off",
    "@typescript-eslint/no-this-alias": "error",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-enum-comparison": "error",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "args": "after-used",
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }
    ],
    '@typescript-eslint/no-unused-expressions': 'off',
    "@typescript-eslint/prefer-for-of": "error",
    "@typescript-eslint/prefer-function-type": "error",
    "@typescript-eslint/prefer-includes": "off",
    "@typescript-eslint/prefer-namespace-keyword": "error",
    "@typescript-eslint/prefer-regexp-exec": "off",
    "@typescript-eslint/prefer-string-starts-ends-with": "off",
    "@typescript-eslint/promise-function-async": "error",
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/restrict-template-expressions": [
      "warn",
      {
        "message": "This rule will be set to error in the next major release."
      }
    ],
    "@typescript-eslint/triple-slash-reference": "error",
    "@typescript-eslint/typedef": "off",
    "@typescript-eslint/unbound-method": "error",
    "@typescript-eslint/unified-signatures": "error",
    "arrow-body-style": "off",
    "camelcase": "off", // Using @typescript-eslint/naming-convention instead
    "complexity": "off",
    "constructor-super": "error",
    "curly": [
      "off",
      "multi-line"
    ],
    "dot-notation": "off",
    "@typescript-eslint/dot-notation": "error",
    "eqeqeq": [
      "error",
      "smart"
    ],
    "guard-for-in": "error",
    "id-denylist": [
      "error",
      "any",
      "number",
      "string",
      "boolean",
      "Undefined"
    ],
    "id-match": "error",
    "import/no-deprecated": "off", // using @typescript-eslint/no-deprecated instead
    "import/no-duplicates": "off", // using no-duplicate-imports instead
    "import/order": "off",
    "max-classes-per-file": "off",
    "no-bitwise": "off",
    "no-caller": "error",
    "no-cond-assign": "off",
    "no-console": "error",
    "no-debugger": "error",
    "no-duplicate-imports": "error",
    "no-empty": "off",
    "no-eval": "error",
    "no-fallthrough": "error",
    "no-invalid-this": "off",
    "no-new-wrappers": "error",
    "no-redeclare": "off", // using @typescript-eslint/no-redeclare instead
    "no-restricted-properties": [
      "error", {
        "object": "Math",
        "property": "hypot",
        "message": "Use Geometry.hypotenuse methods instead",
      }
    ],
    "no-restricted-syntax": ["error", { selector: "TSEnumDeclaration[const=true]", message: "const enums are not allowed" }],
    "no-shadow": "off", // using @typescript-eslint/no-shadow instead
    "no-sparse-arrays": "error",
    "no-template-curly-in-string": "error",
    "no-throw-literal": "error",
    "no-undef-init": "error",
    // TODO: The current implementation does not support the configurations we want to allow.  Need to have it extended...
    "no-underscore-dangle": [
      "off",
      {
        "allowAfterThis": true,
        "allowAfterThisConstructor": true,
        "enforceInMethodNames": true
      }
    ],
    "no-unsafe-finally": "error",
    "no-unused-labels": "error",
    "no-var": "error",
    "object-shorthand": "error",
    "one-var": [
      "off",
      "never"
    ],
    // TODO: I'd like to enable this but will cause a lot of breaking changes
    "prefer-arrow/prefer-arrow-functions": [
      "off",
      {
        "disallowPrototype": true,
        "singleReturnOnly": false,
        "classPropertiesAllowed": false
      }
    ],
    "prefer-const": "error",
    "prefer-rest-params": "off",
    "prefer-spread": "off",
    "prefer-template": "error",
    "radix": "error",
    "sort-imports": [
      "error",
      {
        "ignoreDeclarationSort": true,
        "ignoreCase": true,
      }
    ],
    "use-isnan": "error",
    "valid-typeof": "off",
    "@itwin/import-within-package": "error",
    "@itwin/prefer-get": "error",
    "@itwin/require-basic-rpc-values": "off",
    "@itwin/no-internal-barrel-imports": "error",
    "@itwin/require-version-in-deprecation": "error",
  },
}

