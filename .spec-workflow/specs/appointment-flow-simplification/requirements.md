# Requirements Document

## Introduction

The goal of this feature is to simplify the appointment booking process for customers. Currently, the process relies on a magic link flow which is perceived as too complicated. The new flow will introduce a check for email existence. If a user's email is not found in the customer database during the appointment process, a signup/signin form will appear. Upon successful authentication or registration, the user will be returned to the appointment process to complete their booking.

## Alignment with Product Vision

This feature directly supports the **Customer-Centric Design** principle by prioritizing ease of use and removing friction from the booking process. It addresses the "too complicate" pain point identified by the user, ensuring a smoother experience for both new and returning customers, which aligns with the goal of providing a "seamless, trustworthy online shopping experience".

## Requirements

### Requirement 1: Email Existence Check

**User Story:** As a customer booking an appointment, I want the system to check if my email is already registered so that I am routed to the appropriate flow (login vs. signup).

#### Acceptance Criteria

1. WHEN the user enters their email address in the appointment booking form AND submits (or moves to next step), THEN the system SHALL check the customer database for the existence of this email.
2. IF the email exists in the database, THEN the system SHALL proceed to the next step of the appointment process (or prompt for login if not authenticated).
3. IF the email does NOT exist in the database, THEN the system SHALL trigger the New User Flow (Requirement 2).

### Requirement 2: New User Interruption (Signup/Signin Popup)

**User Story:** As a new customer, I want to be prompted to create an account or sign in without losing my place in the appointment booking process, so that I can easily complete my booking.

#### Acceptance Criteria

1. IF the email check (Requirement 1) returns "not found", THEN the system SHALL display a Signup/Signin popup (modal).
2. The popup SHALL allow the user to Register a new account OR Sign In (if they actually have an account but maybe used a different email or made a mistake, though primarily for signup).
3. WHEN the user successfully Signs Up or Signs In via the popup, THEN the popup SHALL close.
4. AFTER the popup closes, the system SHALL automatically return the user to the appointment booking flow, preserving their progress where possible.

### Requirement 3: Simplified Authentication Flow

**User Story:** As a user, I want a simple authentication method that doesn't rely solely on complicated magic links, so that I can access the system quickly.

#### Acceptance Criteria

1. The Signup/Signin form SHALL support standard authentication methods (e.g., password, or a simplified verification) as an alternative or replacement to the "complicated" magic link flow, if applicable. (Note: User specifically mentioned magic link is too complicated, so standard password or social login might be preferred in the popup).

## Non-Functional Requirements

### Usability
- The Signup/Signin popup must be modal and not redirect the user away from the appointment page URL if possible, or ensure state is preserved if a redirect occurs.
- The transition between the appointment form and the popup should be smooth.

### Performance
- The email existence check API should respond in under 200ms to avoid perceived lag.

### Security
- The email check endpoint should be rate-limited to prevent enumeration attacks.