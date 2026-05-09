import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Não permite console.log em prod, mas libera console.warn / console.error
      // pra observabilidade de erros e situações de atenção.
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // any explícito vira warn — força tipagem real ao longo do tempo.
      "@typescript-eslint/no-explicit-any": "warn",

      // Variáveis não usadas viram warn; ignora args prefixados com _.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Segurança: link externo com target=_blank precisa de rel adequado.
      "react/jsx-no-target-blank": "error",
    },
  },
]);

export default eslintConfig;
