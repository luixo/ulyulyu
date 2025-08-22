import React from "react";

import { WordControls } from "~/components/game/word-controls";
import { WordTracker } from "~/components/game/word-tracker";
import { HideControl } from "~/components/hide-control";

type Props = React.PropsWithChildren<{
  hideSensitiveData: boolean;
  setHideSensitiveData: React.Dispatch<React.SetStateAction<boolean>>;
  nextControl: React.ReactNode;
}>;

export const PositionHeader = React.memo<Props>(
  ({ hideSensitiveData, setHideSensitiveData, nextControl, children }) => (
    <div className="grid grid-cols-4 items-start justify-items-center">
      <div className="justify-self-start">
        <HideControl show={hideSensitiveData} setShow={setHideSensitiveData} />
      </div>
      <div className="col-span-2">
        <WordControls>
          <WordTracker />
          {children}
        </WordControls>
      </div>
      <div className="justify-self-end">{nextControl}</div>
    </div>
  ),
);
