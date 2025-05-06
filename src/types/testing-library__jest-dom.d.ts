
// This file provides empty type declarations for Jest DOM matchers
// to satisfy the TypeScript compiler without additional dependencies.

declare namespace jest {
  interface Matchers<R> {
    // Add empty declarations for all Jest-DOM matchers
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveAttribute(attr: string, value?: string): R;
    // Add other Jest-DOM matchers as needed
  }
}

export {};
