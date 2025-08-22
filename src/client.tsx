import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";

import { StartClient } from "@tanstack/react-start";

import { createRouter } from "~/router";

const router = await createRouter();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient router={router} />
    </StrictMode>,
  );
});
