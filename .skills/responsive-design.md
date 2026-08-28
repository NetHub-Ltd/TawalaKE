# Skill: Responsive Design

## Purpose
Adapt the experience to viewport sizes, devices, and input methods while preserving task integrity.

## Procedure
1. Identify the primary task.
2. Identify information that must remain visible.
3. Identify information that can collapse, reorder, or defer.
4. Identify interaction changes required by input method.
5. Test narrow, medium, and wide layouts.
6. Check wrapping and content growth.
7. Check touch targets and keyboard access.
8. Check tables, navigation, dialogs, forms, and dense content.
9. Preserve context during transformations.

## Rules
- Responsive design is not simply shrinking desktop layouts.
- Do not hide critical actions merely to make a screen cleaner.
- Do not assume mobile means fewer capabilities; prioritize the task.
- Choose breakpoints from content and task requirements, not device-name folklore.

## Concrete guidance
- **Breakpoints**: derive from where content breaks, not from device names. Common content-based ranges: < 600 px (narrow), 600–1024 px (medium), > 1024 px (wide).
- **Touch targets**: never smaller than 44×44 px; increase for primary actions.
- **Font scaling**: respect user font-size preferences (use rem/em, not fixed px for text).
- **Viewport meta**: `width=device-width, initial-scale=1` is required.
- **Horizontal overflow**: never allow horizontal scroll for body text; tables may overflow with swipe or collapse.

## Failure modes
Overflow, truncated critical content, unreachable controls, unreadable tables, lost navigation orientation, oversized dialogs, and responsive changes that unexpectedly alter meaning.
