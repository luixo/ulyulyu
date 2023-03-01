import { styled } from "@nextui-org/react";

export const Flex = styled("div", {
	display: "flex",

	variants: {
		direction: {
			row: { flexDirection: "row" },
			column: { flexDirection: "column" },
		},
		mainAxis: {
			start: { justifyContent: "flex-start" },
			center: { justifyContent: "center" },
			end: { justifyContent: "flex-end" },
			spaceAround: { justifyContent: "space-around" },
			spaceEvenly: { justifyContent: "space-evenly" },
			spaceBetween: { justifyContent: "space-between" },
			stretch: { justifyContent: "stretch" },
		},
		crossAxis: {
			start: { alignItems: "flex-start" },
			center: { alignItems: "center" },
			end: { alignItems: "flex-end" },
			stretch: { alignItems: "stretch" },
		},
		wrap: {
			true: { flexWrap: "wrap" },
			reverse: { flexWrap: "wrap-reverse" },
			false: { flexWrap: "nowrap" },
		},
		flex: {
			true: { flex: 1 },
			false: { flex: 0 },
		},
		flexChildren: {
			true: { "& > *": { flex: 1 } },
			false: { "& > *": { flex: 0 } },
		},
		position: {
			relative: { position: "relative" },
			absolute: { position: "absolute" },
		},
	},
});
