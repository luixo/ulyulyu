const filesWithAllowedDevDependencies = ["next.config.js", "scripts/**/*"];

module.exports = {
  extends: [
    "airbnb",
    "airbnb-typescript",
    "airbnb/hooks",
    "prettier",
    "plugin:tailwindcss/recommended",
  ],
  parserOptions: {
    project: "./tsconfig.json",
  },
  plugins: ["react-memo"],
  rules: {
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: filesWithAllowedDevDependencies,
        optionalDependencies: false,
      },
    ],
    "no-void": "off",
    "react/require-default-props": "off",
    // Typescript version of default-case below
    "default-case": "off",
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "eact/jsx-props-no-spreading": "off",
    "jsx-a11y/aria-role": "off",
    "no-return-assign": ["error", "except-parens"],
    "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    "no-nested-ternary": "off",
    "import/prefer-default-export": "off",
    "react/prop-types": "off",
    "react/jsx-props-no-spreading": "off",
    "consistent-return": "off",
    "import/order": [
      "error",
      {
        groups: [["builtin", "external"], "internal", "parent", "sibling"],
        warnOnUnassignedImports: false,
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
        },
        pathGroups: [
          {
            pattern: "react",
            group: "builtin",
            position: "before",
          },
          {
            pattern: "@/**",
            group: "internal",
            position: "before",
          },
        ],
        pathGroupsExcludedImportTypes: ["react", "@/"],
      },
    ],
    "no-console": "error",
    "no-alert": "error",
    "import/extensions": ["error", "never", { json: "always" }],
    "func-style": ["error", "expression", { allowArrowFunctions: true }],
    "react-memo/require-memo": "error",
    "react-memo/require-usememo": "error",
    "@typescript-eslint/ban-types": [
      "error",
      {
        types: {
          FC: "Please use `React.memo` to provide props type into React component",
          "React.FC":
            "Please use `React.memo` to provide props type into React component",
        },
        extendDefaults: true,
      },
    ],
    "no-param-reassign": ["error", { props: false }],
    // Maintained by prettier plugin
    "tailwindcss/classnames-order": "off",
    "tailwindcss/enforces-negative-arbitrary-values": "error",
    "tailwindcss/enforces-shorthand": "error",
    "tailwindcss/migration-from-tailwind-2": "error",
    "tailwindcss/no-arbitrary-value": "error",
    "tailwindcss/no-custom-classname": "error",
  },
  settings: {
    tailwindcss: { callees: ["tv"] },
  },
  overrides: [
    {
      files: ["postcss.config.js"],
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      parserOptions: {
        project: null,
      },
    },
  ],
};
