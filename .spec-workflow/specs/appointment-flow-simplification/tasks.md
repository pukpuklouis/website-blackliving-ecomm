# Appointment Flow Simplification Tasks

## Phase 1: Backend API Development

- [ ] 1.1 Create email check endpoint
  - File: apps/api/src/modules/auth.ts
  - Add GET /auth/check-email endpoint
  - Implement database lookup for user existence
  - Add rate limiting for security
  - Purpose: Check if email exists in customer database
  - _Requirements: Design Document Auth API, Security Requirements_
  - _Prompt: Role: Backend Developer | Task: Implement email existence check endpoint with proper security measures | Restrictions: Must be fast (<200ms), rate-limited, return boolean only | Success: Endpoint responds quickly and securely_

- [ ] 1.2 Add password-based login endpoint
  - File: apps/api/src/modules/auth.ts
  - Add POST /auth/login endpoint
  - Implement password verification against userSecurity table
  - Return JWT token on successful authentication
  - Purpose: Provide password-based login alternative to magic links
  - _Requirements: Design Document Auth API, Requirement 3_
  - _Prompt: Role: Backend Developer | Task: Implement password login endpoint with secure verification | Restrictions: Use existing userSecurity table, return JWT token, handle errors gracefully | Success: Users can login with email/password_

- [ ] 1.3 Create user registration endpoint
  - File: apps/api/src/modules/auth.ts
  - Add POST /auth/register endpoint
  - Create new user record and userSecurity entry
  - Return JWT token for immediate login
  - Purpose: Allow account creation during appointment flow
  - _Requirements: Design Document Auth API, Requirement 2_
  - _Prompt: Role: Backend Developer | Task: Implement user registration endpoint with validation | Restrictions: Create both user and userSecurity records, return JWT token, validate all inputs | Success: New users can register and login immediately_

## Phase 2: Frontend Authentication Modal

- [ ] 2.1 Create unified AuthModal component
  - File: apps/web/src/components/auth/AuthModal.tsx
  - Build modal with Login and Signup tabs
  - Include form validation and error handling
  - Purpose: Provide unified authentication interface
  - _Requirements: Design Document Auth Modal, Requirement 2_
  - _Prompt: Role: React Developer | Task: Create tabbed auth modal with login and signup forms | Restrictions: Must be modal, support both flows, handle errors gracefully | Success: Modal provides seamless login/signup experience_

- [ ] 2.2 Update auth store for new flows
  - File: apps/web/src/stores/authStore.ts
  - Add checkEmail action
  - Add login and register actions
  - Handle modal state management
  - Purpose: Manage authentication state for simplified flow
  - _Requirements: Design Document State Management_
  - _Prompt: Role: Frontend Developer | Task: Extend auth store with email check and password auth actions | Restrictions: Maintain existing API compatibility, add new async actions | Success: Store supports both magic link and password flows_

## Phase 3: Appointment Flow Integration

- [ ] 3.1 Integrate email check into appointment form
  - File: apps/web/src/components/appointment/MultiStepAppointmentForm.tsx
  - Add email check call in PersonalInfoStep
  - Show appropriate modal based on check result
  - Preserve form state during authentication
  - Purpose: Seamlessly integrate auth check into booking flow
  - _Requirements: Design Document Appointment Form Logic, Requirement 1_
  - _Prompt: Role: React Developer | Task: Integrate email check into appointment form with modal triggers | Restrictions: Must preserve form progress, handle both existing and new user flows | Success: Appointment flow adapts based on user existence_

- [ ] 3.2 Handle authentication success and flow resumption
  - File: apps/web/src/components/appointment/MultiStepAppointmentForm.tsx
  - Listen for auth success events
  - Automatically resume appointment flow
  - Clear modal and proceed to next step
  - Purpose: Complete the authentication interruption flow
  - _Requirements: Design Document Appointment Form Logic, Requirement 2_
  - _Prompt: Role: React Developer | Task: Handle auth success and resume appointment booking seamlessly | Restrictions: Must close modal, preserve all form data, proceed to next step | Success: Users return to appointment flow after authentication_

## Phase 4: Testing & Validation

- [ ] 4.1 Create backend API tests
  - File: apps/api/src/modules/auth.test.ts
  - Test email check endpoint
  - Test login and register endpoints
  - Test error scenarios and security
  - Purpose: Ensure backend authentication logic is reliable
  - _Requirements: Design Document Testing Strategy_
  - _Prompt: Role: QA Engineer | Task: Create comprehensive backend tests for auth endpoints | Restrictions: Test all success/error paths, mock database, verify security | Success: All auth endpoints are thoroughly tested_

- [ ] 4.2 Create frontend component tests
  - File: apps/web/src/components/auth/AuthModal.test.tsx
  - Test modal state transitions
  - Test form validation and submission
  - Test error handling
  - Purpose: Ensure auth modal works correctly
  - _Requirements: Design Document Testing Strategy_
  - _Prompt: Role: QA Engineer | Task: Create frontend tests for auth modal component | Restrictions: Test user interactions, validation, error states | Success: Auth modal is fully tested_

- [ ] 4.3 Implement end-to-end appointment flow tests
  - File: apps/web/e2e/appointment-flow.e2e.test.ts
  - Test new user appointment booking with registration
  - Test existing user appointment booking with login
  - Verify flow preservation and modal behavior
  - Purpose: Validate complete user journey
  - _Requirements: Design Document Testing Strategy_
  - _Prompt: Role: QA Engineer | Task: Create E2E tests for complete appointment booking flows | Restrictions: Test real user interactions, verify state preservation, check modal behavior | Success: End-to-end appointment flows work correctly_

## Phase 5: Documentation & Deployment

- [ ] 5.1 Update API documentation
  - File: apps/api/README.md
  - Document new auth endpoints
  - Include request/response examples
  - Purpose: Enable proper API usage
  - _Requirements: Design Document Components_
  - _Prompt: Role: Technical Writer | Task: Document new authentication endpoints with examples | Restrictions: Must be accurate, comprehensive, follow existing patterns | Success: Developers understand new auth endpoints_

- [ ] 5.2 Update user-facing help content
  - File: appointment help pages or FAQ
  - Explain the simplified booking process
  - Document login/signup options
  - Purpose: Help users understand the new flow
  - _Requirements: Design Document Overview_
  - _Prompt: Role: Technical Writer | Task: Create user documentation for simplified appointment flow | Restrictions: Must be clear, accessible, cover all scenarios | Success: Users understand the simplified booking process_

- [ ] 5.3 Deploy and monitor
  - Manual task: Deploy authentication changes
  - Monitor error rates and user adoption
  - Collect feedback on user experience
  - Purpose: Ensure successful production deployment
  - _Requirements: All phases completed_
  - _Prompt: Role: DevOps Engineer | Task: Deploy auth changes and establish monitoring | Restrictions: Must ensure backward compatibility, monitor performance | Success: New auth flow is deployed and monitored_