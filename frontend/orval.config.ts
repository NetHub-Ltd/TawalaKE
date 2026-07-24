import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "https://omnipos-c9u5.onrender.com/openapi.json",

    output: {
      target: "./src/lib/api/generated/index.ts",
      schemas: "./src/lib/api/generated/models",

      client: "react-query",
      mode: "tags-split",

      prettier: true,

      override: {
        mutator: {
          path: "./src/lib/api/fetcher.ts",
          name: "customFetcher",
        },

        query: {
          useQuery: true,
          useInfinite: true,
          useMutation: true,
        },

        operationName: (operation, _route, _verb) => {
          if (!operation.operationId) {
            throw new Error(`Missing operationId for route: ${_route}`);
          }
          return operation.operationId;
        },
      },
    },
  },
});