import React from "react";

import { Button, Tooltip, styled } from "@nextui-org/react";

import { WithQuery } from "@/components/game/with-query";
import { userContext } from "@/contexts/user-id-context";
import { getAvatar } from "@/lib/names";
import { RouterOutput } from "@/lib/trpc";

const BadgeButton = styled(Button, {
	zIndex: 1,
});

const UserButton = React.memo<{ user: RouterOutput["users"]["upsert"] }>(
	({ user }) => {
		const avatar = getAvatar(user.id, null, user.name);
		const badgeCss = React.useMemo(
			() => ({
				borderColor: avatar.color,
				color: avatar.color,
			}),
			[avatar.color],
		);
		return (
			<Tooltip content={user.id} placement="bottom">
				<BadgeButton css={badgeCss} bordered>
					{avatar.name}
				</BadgeButton>
			</Tooltip>
		);
	},
);

export const UserIdInfo = React.memo(() => {
	const user = React.useContext(userContext)!;
	const { query } = user;
	return (
		<WithQuery query={query}>{(data) => <UserButton user={data} />}</WithQuery>
	);
});
