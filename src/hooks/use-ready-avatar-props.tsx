import React from "react";

import {
  IoCloseOutline as NotReadyIcon,
  IoCheckmarkOutline as ReadyIcon,
} from "react-icons/io5";

export const useReadyAvatarProps = (ready: boolean) =>
  React.useMemo(
    () => ({
      color: ready ? ("success" as const) : ("warning" as const),
      fallback: ready ? <ReadyIcon size={24} /> : <NotReadyIcon size={24} />,
    }),
    [ready],
  );
