import type React from "react";

import * as wordControls from "~/components/game/word-controls";
import { WordTracker } from "~/components/game/word-tracker";
import { HideControl } from "~/components/hide-control";

export const PositionHeader: React.FC<
  React.PropsWithChildren<{
    hideSensitiveData: boolean;
    setHideSensitiveData: React.Dispatch<React.SetStateAction<boolean>>;
    nextControl: React.ReactNode;
  }>
> = ({ hideSensitiveData, setHideSensitiveData, nextControl, children }) => (
  <div className="grid grid-cols-4 items-start justify-items-center">
    <div className="justify-self-start">
      <HideControl show={hideSensitiveData} setShow={setHideSensitiveData} />
    </div>
    <div className="col-span-2">
      <wordControls.WordControls>
        <WordTracker />
        {children}
      </wordControls.WordControls>
    </div>
    <div className="justify-self-end">{nextControl}</div>
  </div>
);
