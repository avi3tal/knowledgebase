import type { ReactNode } from "react";
import { Component } from "react";

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
        <p className="why wrong">
          Could not render {this.props.label ?? "this block"}: {this.state.error.message}
        </p>
      );
    return this.props.children;
  }
}
