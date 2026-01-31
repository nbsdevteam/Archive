import { Provider } from "react-redux";
import { type ReactNode } from "react";
import store from "../../core/data/redux/store";

type ReduxProviderProps = {
  children: ReactNode;
};

/**
 * ReduxProvider - Wraps the existing Redux store
 * This is an adapter that allows us to gradually migrate to the new architecture
 * while keeping the existing Redux setup intact.
 */
export const ReduxProvider = ({ children }: ReduxProviderProps) => {
  return <Provider store={store}>{children}</Provider>;
};
