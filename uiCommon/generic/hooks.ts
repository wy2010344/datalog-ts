import useLocalStorage from "react-use-localstorage";
import { Dispatch, useEffect, useReducer, useState } from "react";

export function useBoolLocalStorage(
  key: string,
  initVal: boolean
): [boolean, (v: boolean) => void] {
  const [val, setVal] = useLocalStorage(key, `${initVal}`);
  return [parseBool(val), (v: boolean) => setVal(`${v}`)];
}

function parseBool(str: string): boolean {
  return str === "true";
}

export function useJSONLocalStorage<T>(key: string, initVal: T) {
  const [val, setVal] = useLocalStorage(key, JSON.stringify(initVal));
  return [JSON.parse(val), (v: T) => setVal(JSON.stringify(v))];
}

export function useIntLocalStorage(
  key: string,
  initVal: number
): [number, (v: number) => void] {
  const [val, setVal] = useLocalStorage(key, `${initVal}`);
  return [parseInt(val), (v: number) => setVal(`${v}`)];
}

// inspired by the Elm architecture
export function useEffectfulReducer<S, A>(
  reducer: (state: S, action: A) => [S, Promise<A>],
  initialState: S
): [S, (a: A) => void] {
  const myReducer = (prevPair: [S, Promise<A>], action: A): [S, Promise<A>] => {
    const [prevState, _] = prevPair;
    return reducer(prevState, action);
  };
  const [[state, effect], dispatch] = useReducer(myReducer, [
    initialState,
    null,
  ]);
  useEffect(() => {
    if (effect) {
      effect.then((action) => dispatch(action));
    }
  }, [effect]);
  return [state, dispatch];
}
