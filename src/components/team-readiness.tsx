import React from "react";

import { Avatar, Badge, Skeleton } from "@heroui/react";
import BoringAvatar from "boring-avatars";
import { entries } from "remeda";
import { twMerge } from "tailwind-merge";

import type { UserId } from "~/db/database.gen";
import { useGame } from "~/hooks/use-game";
import { useReadyAvatarProps } from "~/hooks/use-ready-avatar-props";
import { getAvatar } from "~/utils/names";

const COLORS = Array.from({ length: 6 }).map(
  (_, index) => `var(--color-avatar${index + 1})`,
);

export type EndContent =
  | React.ReactNode
  | ((opts: { teamId: UserId }) => React.ReactNode);

export const TeamReadiness = React.memo<
  Partial<Omit<React.ComponentProps<typeof BoringAvatar>, "name">> & {
    teamId: UserId;
    ready: boolean;
  }
>(({ teamId, ready, colors, className, ...props }) => {
  const { id: gameId } = useGame();
  const { teams } = useGame();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const avatar = getAvatar(teamId, gameId, teams[teamId]!.nickname);
  return (
    <div className="flex items-center gap-2">
      <Badge color={ready ? "success" : "warning"} isDot content="">
        <BoringAvatar
          className={twMerge("size-10", className)}
          name={avatar.name}
          variant="bauhaus"
          colors={colors || COLORS}
          {...props}
        />
      </Badge>
      <span className="text-lg">{avatar.name}</span>
    </div>
  );
});

const TeamReadinessLineSkeleton = () => {
  const props = useReadyAvatarProps(false);
  return (
    <div className="flex items-center gap-2">
      <Avatar {...props} className="opacity-50" />
      <Skeleton className="h-5 w-40 rounded-md" />
    </div>
  );
};

const TeamReadinessLine = React.memo<{
  teamId: UserId;
  ready: boolean;
  endContent?: EndContent;
}>(({ teamId, ready, endContent }) => (
  <div className="flex w-full justify-between gap-4">
    <TeamReadiness teamId={teamId} ready={ready} />
    {typeof endContent === "function" ? endContent({ teamId }) : endContent}
  </div>
));

export const TeamReadinessSkeleton: React.FC<{ amount: number }> = ({
  amount,
}) => (
  <div className="flex flex-col gap-2">
    {Array.from({ length: amount }).map((_, index) => (
      <TeamReadinessLineSkeleton key={index} />
    ))}
  </div>
);

type Props = {
  readiness: Record<UserId, boolean>;
  endContent?: EndContent;
};

export const TeamsReadiness = React.memo<Props>(({ readiness, endContent }) => (
  <div className="flex flex-col gap-2">
    {entries(readiness).map(([teamId, ready]) => (
      <TeamReadinessLine
        key={teamId}
        teamId={teamId}
        ready={ready}
        endContent={endContent}
      />
    ))}
  </div>
));
