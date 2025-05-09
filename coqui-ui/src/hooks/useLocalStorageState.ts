import { useEffect, useState } from "react";

export const useLocalStorageState = <T>(
  key: string,
  defaultState: T
): [T, (newState: T) => void] => {
  const [state, setState] = useState(defaultState);
  const handlSetState = (newState: T) => {
    localStorage.setItem(key, JSON.stringify(newState));
    setState(newState);
  };

  useEffect(() => {
    const oldState = localStorage.getItem(key);
    if (oldState) setState(JSON.parse(oldState));
  }, [key]);

  return [state, handlSetState];
};
