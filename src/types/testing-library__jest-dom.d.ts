
/**
 * This file provides empty type declarations for the testing-library__jest-dom
 * to satisfy the TypeScript compiler's requirements.
 */

declare namespace global {
  namespace jest {
    interface Matchers<R> {
      // Add empty matchers to satisfy TypeScript
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toHaveTextContent(text: string | RegExp): R;
      // Add other Jest DOM matchers as needed
    }
  }
}

export {};
