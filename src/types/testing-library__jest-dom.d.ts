
// This is a minimal type declaration file to silence the TypeScript error
// regarding missing types for testing-library__jest-dom

// Explicitly declare the module to prevent TypeScript errors
declare module "@testing-library/jest-dom" {
  // Empty export - just to satisfy the TypeScript compiler
  export {};
}

// Add Jest matchers interface if needed
declare namespace jest {
  interface Matchers<R> {
    // Add any specific matchers you might need
    toBeInTheDocument(): R;
    toBeVisible(): R;
    toHaveTextContent(text: string | RegExp): R;
    // Add other matchers as needed
  }
}
