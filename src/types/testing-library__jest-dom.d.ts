
// This file provides empty type definitions for testing-library__jest-dom
// to resolve TypeScript compiler errors without adding dependencies

declare namespace jest {
  interface Matchers<R> {
    // Add empty definitions for jest-dom matchers
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(attr: string, value?: any): R;
    toBeDisabled(): R;
    toBeEnabled(): R;
    toHaveClass(className: string): R;
    toHaveFocus(): R;
    toBeChecked(): R;
    // Add other common jest-dom matchers as needed
  }
}

// Declare an empty module to satisfy TypeScript
declare module '@testing-library/jest-dom' {}
