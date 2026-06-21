import convexPlugin from "@convex-dev/eslint-plugin";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["convex/_generated/**"] },
  ...tseslint.configs.recommended,
  ...convexPlugin.configs.recommended,
  // Prevent process.env usage — use typed env from convex/env.ts instead.
  {
    files: ["convex/**/*.ts"],
    ignores: ["convex/env.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.object.name='process'][object.property.name='env']",
          message:
            "Use env.VAR_NAME from './env' instead of process.env.VAR_NAME. Add new vars to the schema in convex/env.ts.",
        },
      ],
    },
  },
];
