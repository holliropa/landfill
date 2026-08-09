import { Component, type ErrorInfo, type ReactNode } from "react";

type DetailsPreviewBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type DetailsPreviewBoundaryState = {
  hasError: boolean;
};

export class DetailsPreviewBoundary extends Component<
  DetailsPreviewBoundaryProps,
  DetailsPreviewBoundaryState
> {
  state: DetailsPreviewBoundaryState = { hasError: false };

  static getDerivedStateFromError(): DetailsPreviewBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Storage details preview failed to render", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
