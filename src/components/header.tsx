import React from "react";

import { Spacer, styled } from "@nextui-org/react";
import { useRouter } from "next/router";
import { VscWordWrap as LogoIcon } from "react-icons/vsc";

import { ClickableIcon } from "@/components/base/clickable-icon";
import { Flex } from "@/components/base/flex";
import { AccountSettings } from "@/components/settings/account-settings";
import { Settings } from "@/components/settings/settings";

const Logo = styled(LogoIcon, {
	padding: 12,
	textGradient: "45deg, $blue600 -20%, $pink600 50%",
	backgroundClip: "content-box",
});
const SettingsBlock = styled(Flex, { padding: 12 });

type Props = {
	title?: React.ReactNode;
};

export const Header = React.memo<Props>(({ title }) => {
	const router = useRouter();
	const toIndex = React.useCallback(() => router.push("/"), [router]);
	return (
		<Flex direction="row" mainAxis="spaceBetween" crossAxis="start">
			<ClickableIcon Component={Logo} size={80} onClick={toIndex} />
			{title}
			<SettingsBlock direction="row">
				<AccountSettings />
				<Spacer x={1} />
				<Settings />
			</SettingsBlock>
		</Flex>
	);
});
