# Skill: Interaction Design

## Purpose
Design behavior over time: actions, feedback, transitions, errors, and recovery.

## Core model
Intent → Action → System response → Result → Recovery/next action

## Review
- **Affordance**: can users understand what is interactive and what it does?
- **Feedback**: is it clear that an action happened, is happening, failed, or needs attention?
- **Timing**: does feedback match operation duration?
- **Confirmation**: protect consequential irreversible actions; avoid unnecessary confirmations.
- **Recovery**: prefer undo/correction where practical.
- **Context**: preserve user context and entered work.

## Explicit states
Consider every interactive element across: idle, hover/focus, active, disabled, loading, success, error, empty, submitting, partial/async, and permission-restricted.

### Loading
Use the least disruptive indication appropriate to the operation and preserve context where possible.

### Empty
Explain why the state is empty and, when appropriate, provide the next useful action.

### Error
Explain the problem in user-relevant language, state what can be done, and preserve work where possible.

### Success
Confirm consequential completion clearly without unnecessary interruption.

### Each state should answer
1. What is happening?
2. What does the user need to know?
3. What can they do now?
4. What happens next?
5. Can they recover?

## Anti-patterns
No-feedback buttons, unexplained long spinners, unexplained disabled controls, destructive actions styled like routine actions, unnecessary modals, and custom interactions that violate expectations without benefit.

> Interaction design is behavior design, not animation design.
