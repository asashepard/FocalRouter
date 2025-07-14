import React from "react";

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; msg?: string }
> {
  state = { hasError: false, msg: undefined };
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, msg: e.message };
  }
  render() {
    return this.state.hasError ? (
      <div style={{ padding: 32, color: "crimson" }}>
        <h2>UI Error</h2>
        <pre>{this.state.msg}</pre>
      </div>
    ) : (
      this.props.children
    );
  }
}
