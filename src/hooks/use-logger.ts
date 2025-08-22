import React from "react";

import { useSearch } from "@tanstack/react-router";

export const useLogger = () => {
  const params = useSearch({ from: "__root__" });
  return React.useCallback(
    (message: string) => {
      if (params.debug) {
        console.log(`[DEBUG]: ${message}`);
      }
    },
    [params.debug],
  );
};
