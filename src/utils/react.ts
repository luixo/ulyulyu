export const updateSetStateAction = <T>(
  prevValue: T,
  setStateAction: React.SetStateAction<T>,
) =>
  typeof setStateAction === "function"
    ? (setStateAction as (prevState: T) => T)(prevValue)
    : setStateAction;
