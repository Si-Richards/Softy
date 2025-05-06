
// This is a minimal type declaration file to silence the TypeScript error
// regarding missing types for testing-library__jest-dom
declare namespace jest {
  interface Matchers<R> {
    // Add any specific matchers you might need
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
  }
}

// Declare the module to prevent TypeScript errors
declare module "@testing-library/jest-dom" {
  export {};
}
