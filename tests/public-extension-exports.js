const path = require("path");
const { RuleTester } = require("eslint");
const BentleyESLintPlugin = require("../dist");
const PublicExtensionsExports =
  BentleyESLintPlugin.rules["public-extension-exports"];

const fixtureDir = path.join(
  __dirname,
  "fixtures",
  "no-internal",
  "workspace-pkg-1"
);
const tester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module",
    tsconfigRootDir: fixtureDir,
    shouldCreateDefaultProgram: true,
    project: path.join(fixtureDir, "tsconfig.test.json"),
  },
});

tester.run("public-extension-exports", PublicExtensionsExports, {
  // extensions can only be public
  valid: [
    {
      code: `
      /**
       * @extensions
       * @public
       */
      export function destroyAllIModels(): void{
      }
      `,
      options: [{ releaseTags: ["public", "beta"] }],
    },
    // test defaults
    {
      code: `
        /**
         * @extensions
         * @public
         */
        export function destroyAllIModels(): void{
        }
        `,
    },
    // empty options triggers default
    {
      code: `
        /**
         * @extensions
         * @public
         */
        export function destroyAllIModels(): void{
        }
        `,
      options: [{}],
    },
    // namespace rule
    {
      code: `
        /**
         * @public
         * @extensions
         */
        export namespace Dangerous {
          /**
           * @public
           * @extensions
           */
          export function destroyAllIModels(): void{
          }
        }
        `,
    },
    // Namespace rule, no false positive
    {
      code: `
      /**
       * @public
       */
        export namespace Tileset3dSchema {
          /**
           * @public
           */
          export interface asdkljas {
            [key: string]: any;
          }
        }
        `,
    },
  ],
  invalid: [
    // extensions require public tag.
    {
      code: `
        /**
         * @extensions
         */
        export function destroyAllIModels(): void {
        }
        `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
    },
    // used to allow preview, but no longer
    {
      code: `
      /**
       * @extensions
       * @preview
       */
      export function destroyAllIModels(): void {
      }
      `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
    },
    // added options do nothing for extensions
    {
      code: `
      /**
       * @extensions
       */
      export function destroyAllIModels(): void {
      }
      `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
      options: [{ releaseTags: ["beta", "alpha", "internal"] }],
    },
    // no internal for extensions
    {
      code: `
          /**
           * @extensions
           * @internal
           */
          export function destroyAllIModels(): void {
          }
          `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
      options: [{ releaseTags: ["public", "beta", "internal"] }],
    },
    // no alpha for extensions
    {
      code: `
          /**
           * @extensions
           * @alpha
           */
          export function destroyAllIModels(): void {
          }
          `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
      options: [{ releaseTags: ["public", "alpha", "beta", "internal"] }],
    },
    // no beta for extensions
    {
      code: `
          /**
           * @extensions
           * @beta
           */
          export function destroyAllIModels(): void {
          }
          `,
      errors: [
        {
          message: `Extension exports must be annotated with both an @extensions and @public tag. Please review the tags for "destroyAllIModels".`,
        },
      ],
      options: [{ releaseTags: ["public", "beta", "internal"] }],
    },
    // namespace must have extensions tag if child has it
    {
      code: `
        /**
         * @public
         */
        export namespace Dangerous{
          /**
           * @public
           * @extensions
           */
          export function destroyAllIModels(): void{
          }
        }
        `,
      errors: [
        {
          message: `Namespace "Dangerous" requires an @extensions tag because one of its members is tagged for @extensions.`,
        },
      ],
    },
    // no tags on namespace, but child has @extensions
    {
      code: `
        /**
         */
        export namespace Dangerous{
          /**
           * @public
           * @extensions
           */
          export function destroyAllIModels(): void{
          }
        }
        `,
      errors: [
        {
          message: `Namespace "Dangerous" requires an @extensions tag because one of its members is tagged for @extensions.`,
        },
      ],
    },
  ],
});
