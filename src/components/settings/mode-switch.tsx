import React from "react";

import { Switch } from "@heroui/react";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";

import { useMounted } from "~/hooks/use-mounted";

export const ModeSwitch = () => {
  const [mode, setMode] = React.useState<"light" | "dark" | "auto">("auto");
  const isMounted = useMounted();
  const [autoMode] = React.useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme:dark)").matches
      ? "dark"
      : "light";
  });
  const actualMode = mode === "auto" ? autoMode : mode;
  React.useEffect(() => {
    if (actualMode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [actualMode]);
  return (
    <Switch
      isSelected={isMounted ? actualMode === "dark" : false}
      onValueChange={(selected) => setMode(selected ? "dark" : "light")}
      color="default"
      endContent={<IoMoonOutline />}
      size="lg"
      startContent={<IoSunnyOutline />}
    />
  );
};
