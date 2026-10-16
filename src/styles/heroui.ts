import { heroui } from "@heroui/react";
import "react";

export default heroui();

declare module "react" {
	// Custom properties augment React's existing interface with a template-literal index.
	// oxlint-disable-next-line typescript/consistent-type-definitions
	interface CSSProperties {
		// oxlint-disable-next-line typescript/consistent-indexed-object-style
		[key: `--${string}`]: string | number;
	}
}
