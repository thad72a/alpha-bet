# Dropdown Z-Index Fix

## Problem

The "More" dropdown menu on the home page was appearing **behind other components** (cards, sections) instead of on top of them, making it unusable.

## Root Cause

Multiple z-index and stacking context issues:

1. **Parent container had low z-index**: Navigation tabs section was `z-10`, same as main content
2. **Dropdown had insufficient z-index**: Originally `z-50` wasn't high enough
3. **No overflow control**: Parent flex container didn't have explicit `overflow-visible`
4. **Stacking context**: The dropdown's parent `<div>` didn't have its own z-index

## Solution

### 1. Z-Index Hierarchy

Created a proper z-index stacking order:

```typescript
// Navigation tabs section (parent of all filters)
z-40  // Up from z-10

// Dropdown parent container
z-50  // Establishes stacking context

// Dropdown menu itself
z-[100]  // Much higher than any content (was z-50)
```

### 2. Overflow Control

Added `overflow-visible` to the flex container holding the category buttons:

```tsx
<div className="flex items-center space-x-1 py-4 overflow-visible">
```

This ensures the dropdown isn't clipped by parent boundaries.

### 3. Click Outside to Close

Added proper click handling:

```typescript
// Close dropdown when clicking outside
useEffect(() => {
  const handleClickOutside = () => {
    if (showMoreDropdown) {
      setShowMoreDropdown(false)
    }
  }
  
  if (showMoreDropdown) {
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }
}, [showMoreDropdown])

// Stop propagation on button and dropdown clicks
<button onClick={(e) => {
  e.stopPropagation()
  setShowMoreDropdown(!showMoreDropdown)
}}>
```

## Files Modified

- **`app/page.tsx`**
  - Updated navigation tabs section: `z-10` → `z-40`
  - Updated dropdown parent: Added `z-50`
  - Updated dropdown menu: `z-50` → `z-[100]`
  - Added `overflow-visible` to flex container
  - Added click-outside-to-close functionality
  - Added `stopPropagation` to prevent accidental closes

## Result

✅ Dropdown now appears **on top of all other elements**
✅ No longer hidden behind cards or other components
✅ Proper click-outside-to-close behavior
✅ Smooth user experience

## Z-Index Reference

For future reference, here's the z-index hierarchy used in the app:

- `z-0` to `z-10`: Background elements, base content
- `z-40`: Navigation sections (headers, tabs)
- `z-50`: Elevated UI elements (dropdown parents)
- `z-[100]`: Dropdown menus, popovers
- `z-[9999]`: Modals (CreateCardModal, BettingModal)

Always ensure dropdowns are at least `z-50` or higher to stay above content cards.

