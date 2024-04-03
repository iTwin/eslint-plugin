const path = require("path");
const { RuleTester } = require("eslint");
const BentleyESLintPlugin = require("../dist");
const RequireReleaseTags =
  BentleyESLintPlugin.rules["exports-require-release-tags"];

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

tester.run("exports-require-release-tags", RequireReleaseTags, {
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
    // non-extensions
    {
      code: `
        /**
         * @alpha
         */
        export function destroyAllIModels(): void{
        }
        `,
    },
    {
      code: `
        /**
         * @beta
         */
        export function destroyAllIModels(): void{
        }
        `,
    },
    {
      code: `
        /**
         * @public
         */
        export function destroyAllIModels(): void{
        }
        `,
    },
    {
      code: `
        /**
         * @internal
         */
        export function destroyAllIModels(): void{
        }
        `,
    },
    // custom options for non-extensions
    {
      code: `
        /**
         * @alpha
         */
        export function destroyAllIModels(): void{
        }
        `,
      options: [{ releaseTags: ["public", "alpha"] }],
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
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
          message: `Extension exports must be annotated with both an @extensions and @public tag. Check the "destroyAllIModels" type.`,
        },
      ],
      options: [{ releaseTags: ["public", "beta", "internal"] }],
    },
    // no multiple tags w/ extensions
    {
      code: `
        /**
         * @extensions
         * @public
         * @beta
         */
        export function destroyAllIModels(): void {

        }
        `,
      errors: [
        {
          message: `Only one release tag per export is allowed. Check the "destroyAllIModels" type.`,
        },
      ],
    },
    // no multiple tags w/o extensions
    {
      code: `
            /**
             * @public
             * @beta
             */
            export function destroyAllIModels(): void {
    
            }
            `,
      errors: [
        {
          message: `Only one release tag per export is allowed. Check the "destroyAllIModels" type.`,
        },
      ],
    },
    // non-extension exports
    {
      code: `
      /**
       */
      export function destroyAllIModels(): void {
        
      }
      `,
      errors: [
        {
          message: `Exports must be annotated with one of the following: public, beta, alpha, internal. Check the "destroyAllIModels" type.`,
        },
      ],
    },

    // non-extension exports with custom options:
    {
      code: `
      /** @alpha */
      export function destroyAllIModels(): void {
        
      }
      `,
      errors: [
        {
          message: `Exports must be annotated with one of the following: public, beta. Check the "destroyAllIModels" type.`,
        },
      ],
      options: [{ releaseTags: ["public", "beta"] }],
    },
  ],
});
