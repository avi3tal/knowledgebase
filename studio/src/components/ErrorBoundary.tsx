import type { ReactNode } from "react";
import { Component } from "react";
import * as S from "./ErrorBoundary.style";

/** Keeps one broken widget (a figure, a trace) from blanking the whole page. */
export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <S.Message>
          Could not render {this.props.label ?? "this block"}: {this.state.error.message}
        </S.Message>
      );
    return this.props.children;
  }
}
