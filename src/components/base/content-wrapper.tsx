import { styled } from "@nextui-org/react";

export const ContentWrapper = styled("div", {
	display: "flex",
	alignContent: "center",
	cursor: "pointer",
	height: "100%",
	padding: "0px calc(var(--nextui--inputHeightRatio) * var(--nextui-space-3))",

	variants: {
		disabled: {
			true: {
				cursor: "default",
				opacity: 0.5,
			},
		},
	},
});
