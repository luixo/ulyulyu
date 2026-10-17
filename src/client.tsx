import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { getRouter } from "~/router";

const router = await getRouter();

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<RouterClient router={router} />
		</StrictMode>,
	);
});
