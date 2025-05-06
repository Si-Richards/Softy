
/// <reference types="@types/testing-library__jest-dom" />

// Extend the global jest namespace to include the Jest DOM matchers
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    toHaveClass(className: string): R;
    // Add other matchers as needed
  }
}

// Augment the global expect function with Jest DOM matchers
interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toBeVisible(): R;
  toHaveTextContent(text: string | RegExp): R;
  toHaveClass(className: string): R;
  // Add other matchers as needed
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}
