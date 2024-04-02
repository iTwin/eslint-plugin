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
  valid: [
    {
      code: `
      /**
       * @extensions
       * @beta
       */
      export function destroyAllIModels(): void{
      }
      `,
      options: [{ releaseTags: ["public", "beta"] }],
    },
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
         * @alpha
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
         * @alpha
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
         * @alpha
         */
        export function destroyAllIModels(): void{
        }
        `,
      options: [{}],
    },
  ],
  invalid: [
    // default valid release tags
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public, beta, alpha. Check the "destroyAllIModels" type.`,
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public, beta, alpha. Check the "destroyAllIModels" type.`,
        },
      ],
    },
    // restrict to added options
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public, beta. Check the "destroyAllIModels" type.`,
        },
      ],
      options: [{ releaseTags: ["public", "beta"] }],
    },
    // no internal for extensions even if added to releaseTags
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public, beta. Check the "destroyAllIModels" type.`,
        },
      ],
      options: [{ releaseTags: ["public", "beta", "internal"] }],
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
