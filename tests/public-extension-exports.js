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
  valid: [
    // Add valid test cases here
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
  ],
  invalid: [
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public. Check the "destroyAllIModels" type.`,
        },
      ],
    },
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public. Check the "destroyAllIModels" type.`,
        },
      ],
    },
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
          message: `Public extension exports must be annotated with both an @extensions tag and one of the following: public. Check the "destroyAllIModels" type.`,
        },
      ],
    },
  ],
});
