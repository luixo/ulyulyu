import React from "react";

import { Button, Tooltip } from "@heroui/react";

import { UserContext } from "~/contexts/user-id-context";
import { getAvatar } from "~/utils/names";

const UserButton: React.FC<{ user: React.ContextType<typeof UserContext> }> = ({
  user,
}) => {
  const avatar = getAvatar(user.id, null, user.name);
  return (
    <Tooltip content={user.id} placement="bottom">
      <Button
        className="z-10"
        variant="bordered"
        style={{
          borderColor: avatar.color,
          color: avatar.color,
        }}
      >
        {avatar.name}
      </Button>
    </Tooltip>
  );
};

export const UserIdInfo = () => {
  const user = React.use(UserContext);
  return <UserButton user={user} />;
};
