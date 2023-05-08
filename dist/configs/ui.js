/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

const jam3Plugin = require("eslint-plugin-jam3");
const jsxA11yPlugin = require("eslint-plugin-jsx-a11y");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const reactPlugin = require("eslint-plugin-react");

const itwinjsRecommended = require("./itwinjs-recommended");

const reactSetStageUsageRule = require("../rules/react-set-state-usage");

module.exports = 
  {
    ...itwinjsRecommended,
    ...jsxA11yPlugin.configs.recommended,
    ...reactPlugin.configs.recommended,
    plugins: {
      "jam3": jam3Plugin,
      "jsx-a11y": jsxA11yPlugin,
      "react-hooks": reactHooksPlugin,
      "react": reactPlugin,
      custom: {
        rules: {
          reactSetStageUsage: reactSetStageUsageRule
        }
      }
    },
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "jam3/no-sanitizer-with-danger": 2,
      "max-statements-per-line": "off", // override itwinjs-recommended
      "nonblock-statement-body-position": "off", // override itwinjs-recommended
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "function",
          "format": [
            "camelCase",
            "PascalCase"
          ]
        }
      ],
      "custom/reactSetStageUsage": ["error", { "updater-only": false, "allow-object": true }],
      "@typescript-eslint/unbound-method": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
    "settings": {
      "react": {
        "version": "detect"
      }
    }
  }

