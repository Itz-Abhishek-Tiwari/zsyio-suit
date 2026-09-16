export interface DefaultTestCaseTemplate {
  title: string;
  description?: string;
  steps: string;
  expectedResult: string;
  order: number;
}

export const DEFAULT_TICKET_TEST_CASES: DefaultTestCaseTemplate[] = [
  {
    title: "Verify Core Acceptance Criteria & Happy Path",
    description: "Ensure all primary business requirements and workflows function as requested.",
    steps: "1. Follow the primary action flow specified in the ticket.\n2. Provide standard valid inputs and submit.\n3. Verify state changes and data persistence.",
    expectedResult: "Workflow completes successfully, data persists accurately, and appropriate success feedback is displayed.",
    order: 0,
  },
  {
    title: "Input Validation, Boundary & Error Handling",
    description: "Verify resilience against invalid, empty, or boundary inputs.",
    steps: "1. Attempt to submit with empty required fields.\n2. Input special characters, extreme values, or invalid formats.\n3. Trigger rapid repeated clicks on action buttons.",
    expectedResult: "Descriptive validation messages/toasts appear; no unhandled crashes, blank screens, or duplicate submissions.",
    order: 1,
  },
  {
    title: "UI / UX, Responsive Layout & Theme Verification",
    description: "Ensure visual consistency, spacing, responsive behavior, and theme support.",
    steps: "1. Inspect UI layout on Desktop (1280px+), Tablet (768px), and Mobile (<640px).\n2. Toggle between Dark Mode and Light Mode.\n3. Verify typography, padding, color contrast, and loading skeletons.",
    expectedResult: "Layouts adapt fluidly with zero horizontal overflow; theme tokens and text contrast remain legible and crisp.",
    order: 2,
  },
  {
    title: "Regression & Console / Network Health Check",
    description: "Verify adjacent features remain unaffected and no runtime errors occur.",
    steps: "1. Open DevTools > Console and check for uncaught JS errors/warnings.\n2. Open DevTools > Network and ensure API calls return expected 2xx statuses.\n3. Quickly smoke test adjacent modules connected to this feature.",
    expectedResult: "0 runtime exceptions in console, clean HTTP status codes, and existing system features continue functioning normally.",
    order: 3,
  },
];
