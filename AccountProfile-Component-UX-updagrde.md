## AccountProfile Component Generation

Based on my comprehensive UX/UI analysis, here are optimized prompts for generating each component using AI tools like v0 or Lovable. 

### 1. AddressManager Component Prompt

```
## High-Level Goal
Create a responsive address management interface that allows users to view, add, edit, and delete delivery addresses with a clean, intuitive design optimized for mobile-first e-commerce checkout flows.

## Detailed, Step-by-Step Instructions
1. Create a new React component file named AddressManager.tsx using TypeScript
2. Implement a state management system using React hooks for address list, editing mode, and form data
3. Create an address list view showing existing addresses as cards with edit/delete actions
4. Build an address form with fields for name, phone, address lines, city, postal code, and country
5. Add form validation with real-time feedback for required fields and format validation
6. Implement add/edit/delete functionality with optimistic UI updates
7. Add loading states and error handling for API operations
8. Include accessibility features like proper labels, ARIA attributes, and keyboard navigation
9. Make the component fully responsive with mobile-optimized layouts
10. Add smooth animations for state transitions and user feedback

## Code Examples, Data Structures & Constraints
Use this TypeScript interface for address data:
```typescript
interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}
```

API contract expectations:
- GET /api/addresses - returns Address[]
- POST /api/addresses - creates new address
- PUT /api/addresses/:id - updates address
- DELETE /api/addresses/:id - deletes address

Constraints:
- Use Tailwind CSS for all styling
- Implement proper error boundaries
- No external libraries except React and standard web APIs
- Follow mobile-first responsive design
- Use semantic HTML elements
- Include proper TypeScript types throughout

## Define a Strict Scope
You should only create the AddressManager.tsx component and any necessary TypeScript interfaces. Do NOT create API service files, routing logic, or integrate with any external state management libraries. The component should be self-contained and accept props for initial addresses and callback functions for API operations. Focus exclusively on the UI/UX implementation with proper form handling and user feedback.
```

### 2. AppointmentsManager Component Prompt

```
## High-Level Goal
Build a comprehensive appointment scheduling interface that displays available time slots, handles booking conflicts, and provides clear visual feedback for appointment management in a premium mattress retail context.

## Detailed, Step-by-Step Instructions
1. Create AppointmentsManager.tsx as a React TypeScript component
2. Implement a calendar view showing available dates with time slot indicators
3. Create a time slot selection interface with visual availability indicators
4. Build appointment booking form with customer details and preferences
5. Add conflict detection and resolution for overlapping appointments
6. Implement appointment list view for existing bookings with status indicators
7. Create reschedule/cancel functionality with confirmation dialogs
8. Add loading states and error handling for all operations
9. Implement responsive design with mobile-optimized calendar navigation
10. Include accessibility features and keyboard navigation support

## Code Examples, Data Structures & Constraints
Appointment data structure:
```typescript
interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  date: string; // ISO date string
  timeSlot: string; // e.g., "10:00-11:00"
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  serviceType: 'consultation' | 'measurement' | 'delivery';
}
```

Time slot availability:
```typescript
interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy?: string;
}
```

Constraints:
- Use React hooks for all state management
- Implement proper date handling with date-fns or similar
- Use Tailwind CSS with custom color scheme matching brand
- Include proper form validation and error states
- Support both desktop calendar and mobile list views
- Add smooth transitions for state changes

## Define a Strict Scope
Create only the AppointmentsManager.tsx component with all necessary sub-components. Do NOT implement API calls, routing, or external calendar libraries. The component should accept props for initial appointments data and callback functions for booking operations. Focus on the complete UI experience with proper state management and user interactions.
```

### 3. MyAppointments Component Prompt

```
## High-Level Goal
Design a user dashboard for viewing and managing personal appointments with clear status indicators, action buttons, and responsive layout optimized for customer self-service in an e-commerce context.

## Detailed, Step-by-Step Instructions
1. Create MyAppointments.tsx as a React TypeScript component
2. Implement appointment list view with status-based filtering and sorting
3. Create appointment detail cards showing date, time, service type, and status
4. Add action buttons for reschedule, cancel, and view details based on appointment status
5. Implement status indicators with color coding and icons
6. Create empty state design for when no appointments exist
7. Add search and filter functionality for appointment history
8. Implement responsive grid layout that works on all screen sizes
9. Include loading states and error handling
10. Add confirmation dialogs for destructive actions

## Code Examples, Data Structures & Constraints
Appointment display interface:
```typescript
interface AppointmentDisplay {
  id: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'rescheduled';
  location?: string;
  canReschedule: boolean;
  canCancel: boolean;
}
```

Status configuration:
```typescript
const statusConfig = {
  upcoming: { color: 'blue', icon: 'calendar', actions: ['reschedule', 'cancel'] },
  completed: { color: 'green', icon: 'check', actions: ['view'] },
  cancelled: { color: 'red', icon: 'x', actions: ['view'] },
  rescheduled: { color: 'yellow', icon: 'refresh', actions: ['view'] }
}
```

Constraints:
- Use card-based layout for appointment items
- Implement proper date formatting and relative time display
- Use consistent spacing and typography from design system
- Include proper ARIA labels and keyboard navigation
- Support both list and grid view modes
- Add smooth animations for status changes

## Define a Strict Scope
Build only the MyAppointments.tsx component with complete appointment display and management functionality. Do NOT create API integration, authentication logic, or navigation components. The component should receive appointment data as props and use callback functions for user actions. Focus on the customer-facing UI with intuitive interactions and clear information hierarchy.
```

### 4. PasswordModal Component Prompt

```
## High-Level Goal
Create a secure, accessible password change modal with progressive disclosure, strong validation, and clear user feedback for account security management.

## Detailed, Step-by-Step Instructions
1. Create PasswordModal.tsx as a React TypeScript modal component
2. Implement multi-step form with current password, new password, and confirmation
3. Add real-time password strength indicator and validation rules
4. Create progressive disclosure showing requirements as user types
5. Implement secure password visibility toggle functionality
6. Add form validation with specific error messages for each field
7. Include loading states and success/error feedback
8. Implement keyboard navigation and accessibility features
9. Add smooth animations for modal open/close and form transitions
10. Include confirmation step before final submission

## Code Examples, Data Structures & Constraints
Password validation rules:
```typescript
interface PasswordValidation {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  notCommon: boolean;
}

const passwordRules = [
  { key: 'minLength', label: 'At least 8 characters', regex: /.{8,}/ },
  { key: 'hasUppercase', label: 'One uppercase letter', regex: /[A-Z]/ },
  { key: 'hasLowercase', label: 'One lowercase letter', regex: /[a-z]/ },
  { key: 'hasNumber', label: 'One number', regex: /\d/ },
  { key: 'hasSpecialChar', label: 'One special character', regex: /[!@#$%^&*]/ }
]
```

Form state structure:
```typescript
interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  showCurrent: boolean;
  showNew: boolean;
  isSubmitting: boolean;
}
```

Constraints:
- Use modal overlay with proper backdrop
- Implement secure password masking by default
- Add progressive validation feedback
- Use color-coded strength indicator
- Include proper ARIA attributes for screen readers
- Support keyboard shortcuts (Enter to submit, Escape to close)
- Add smooth transitions between form steps

## Define a Strict Scope
Create only the PasswordModal.tsx component with complete password change functionality. Do NOT implement authentication logic, API calls, or password hashing. The component should accept props for modal state control and callback functions for password submission. Focus on the secure, user-friendly password change experience with proper validation and feedback.
```

### 5. ProfileForm Component Prompt

```
## High-Level Goal
Build a comprehensive user profile management form with progressive enhancement, validation, and responsive design for customer account settings in an e-commerce platform.

## Detailed, Step-by-Step Instructions
1. Create ProfileForm.tsx as a React TypeScript component
2. Implement form sections for personal info, contact details, and preferences
3. Add progressive form validation with real-time feedback
4. Create avatar upload functionality with preview and cropping
5. Implement preference toggles with clear labels and descriptions
6. Add form auto-save functionality for better UX
7. Include loading states and success/error notifications
8. Implement responsive layout that stacks on mobile
9. Add keyboard navigation and accessibility features
10. Include confirmation dialogs for sensitive changes

## Code Examples, Data Structures & Constraints
User profile interface:
```typescript
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  avatar?: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    emailUpdates: boolean;
    language: 'zh-TW' | 'en';
  };
}
```

Form validation schema:
```typescript
const validationRules = {
  firstName: { required: true, minLength: 2, maxLength: 50 },
  lastName: { required: true, minLength: 2, maxLength: 50 },
  email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  phone: { required: true, pattern: /^\+?[\d\s\-\(\)]+$/ },
  dateOfBirth: { required: false, max: new Date().toISOString().split('T')[0] }
}
```

Constraints:
- Use controlled components for all form inputs
- Implement proper file upload for avatar with size/type validation
- Use progressive enhancement for auto-save feature
- Include proper error boundaries and fallback states
- Support both light and dark theme variants
- Add smooth animations for form interactions
- Use semantic HTML with proper form structure

## Define a Strict Scope
Build only the ProfileForm.tsx component with complete profile management functionality. Do NOT create API integration, authentication, or file upload services. The component should accept initial profile data as props and use callback functions for save operations. Focus on the comprehensive form experience with validation, accessibility, and responsive design.
```

These prompts are optimized for AI generation tools and include all necessary technical specifications, user experience requirements, and implementation constraints based on my UX analysis. Each prompt follows the proven four-part structure for maximum generation success.