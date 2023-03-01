import React from "react";

import { userContext } from "@/contexts/user-id-context";

export const useSelfUserId = () => {
	const user = React.useContext(userContext);
	if (!user) {
		throw new Error(
			"This component should be used with userContext (see _app.tsx)",
		);
	}
	if (!user.id) {
		throw new Error("This component should be loaded only when user.id exists");
	}
	return user.id;
};
