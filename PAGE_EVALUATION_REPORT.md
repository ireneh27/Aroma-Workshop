# Website Page Evaluation Report

**Evaluation Date:** November 2025
**Pages Analyzed:** `my-formulas.html`, `scenario-suggestions.html`
**Objective:** Determine necessity and potential redundancy

---

## Executive Summary

**Recommendation:**
- ✅ **KEEP** `my-formulas.html` - Provides unique viewing history functionality
- ❌ **REMOVE** `scenario-suggestions.html` - Completely redundant with `formulas.html`

---

## 1. my-formulas.html Analysis

### Purpose
Display recently viewed formulas (viewing history) for logged-in users with usage statistics.

### Key Features
- **Recently Viewed**: Shows formulas from `FORMULA_DATABASE` that user has viewed
- **Statistics Dashboard**:
  - Total viewing history count
  - Total AI queries used
  - Remaining AI query count
- **Clear History**: Button to clear viewing history
- **Login Required**: Shows lock screen for non-authenticated users

### Technical Details
- **File Size**: 344 lines
- **Dependencies**:
  - `auth.js` - getUserHistory(), clearHistory(), getUserStatistics()
  - `formula-database.js` - FORMULA_DATABASE
  - `auth-nav.js` - Dynamic navigation updates
- **Storage**: Uses localStorage via auth.js user history tracking

### Integration Points
```javascript
// Navigation links (shown only when logged in)
// From auth-nav.js lines 19-20:
if (navMyFormulas) {
    navMyFormulas.style.display = 'inline-block';
}

// Referenced in:
- index.html navigation
- formulas.html navigation
```

### Functional Comparison with Other Pages

| Feature | my-formulas.html | recipe-database.html | formulas.html |
|---------|------------------|---------------------|---------------|
| Viewing History | ✅ Yes | ❌ No | ❌ No |
| User Statistics | ✅ Yes | ❌ No | ❌ No |
| Custom Recipes | ❌ No | ✅ Yes | ❌ No |
| Preset Formulas | ✅ (viewed ones) | ❌ No | ✅ (recommended) |
| AI Scenarios | ❌ No | ❌ No | ✅ Yes |

### Verdict: ✅ KEEP

**Rationale:**
1. **Unique Functionality**: Only page showing viewing history - no duplication
2. **User Value**: Helps users track formulas they've explored
3. **Well Integrated**: Properly linked in navigation when logged in
4. **Complementary**: Works alongside recipe-database.html (viewed vs saved)
5. **Active Usage**: Functional and accessible through main navigation

**No Changes Needed** - Page serves a distinct purpose.

---

## 2. scenario-suggestions.html Analysis

### Purpose
Standalone page for displaying comprehensive usage scenario suggestions with elaborate timeline visualization.

### Key Features
- **Central Timeline**: Vertical timeline showing time-based formula usage
- **Two Scenarios**: Side-by-side scenario comparison view
- **Formula Cards**: Detailed formula information for each time slot
- **View Modes**: Detailed, compact, and compare views
- **AI Integration**: Uses scenario-suggestions.js for AI-generated scenarios

### Technical Details
- **File Size**: 717 lines (HTML + extensive inline styles)
- **JavaScript Dependencies**:
  - `scenario-suggestions.js` (59 KB) - Scenario generation logic
  - `formula-database.js`, `formula-suggestions.js`, `ai-service.js`
- **Referenced From**:
  - `questionnaire.js` line 280: Redirects here after saving questionnaire
  - Documentation files only (CLAUDE.md, WEBSITE_CHECK_REPORT.md)

### Critical Issue: Functional Redundancy

**formulas.html already provides the same functionality:**

```javascript
// formulas.html line 71: Loads same script
<script src="scenario-suggestions.js"></script>

// formulas-page.js lines 1153-1155: Generates and displays scenarios
const scenario = await generateTimelineScenario(questionnaireData);
if (scenario) {
    renderTimelineScenario(scenario);
}
```

### Side-by-Side Comparison

| Aspect | scenario-suggestions.html | formulas.html |
|--------|--------------------------|---------------|
| **Scenario Display** | ✅ Yes | ✅ Yes |
| **Timeline View** | ✅ Yes | ✅ Yes |
| **AI Integration** | ✅ scenario-suggestions.js | ✅ scenario-suggestions.js (same) |
| **In Navigation** | ❌ No | ✅ Yes ("您的定制芳疗体验") |
| **Safety Validation** | ❌ No | ✅ Yes (daily usage check) |
| **Comprehensive** | Single-purpose | Multi-purpose (scenarios + safety) |
| **Direct Access** | Only from questionnaire | From navigation + questionnaire |

### Navigation Analysis

**scenario-suggestions.html:**
- ❌ Not in main navigation
- ❌ Only accessible via redirect from questionnaire.js
- ❌ Not discoverable by users
- ❌ Creates fragmented user experience

**formulas.html:**
- ✅ In main navigation as "您的定制芳疗体验"
- ✅ Accessible at any time
- ✅ Better user flow
- ✅ Integrated with other features

### User Flow Issue

```
Current Flow (Problematic):
User fills questionnaire
  → Saves questionnaire
  → Redirected to scenario-suggestions.html (standalone)
  → Dead end / Must navigate away manually

Better Flow:
User fills questionnaire
  → Saves questionnaire
  → Redirected to formulas.html
  → See scenarios + safety check + personalized recommendations
  → In main navigation for return visits
```

### Verdict: ❌ REMOVE

**Rationale:**
1. **100% Redundant**: formulas.html provides identical functionality using same scripts
2. **Better Alternative Exists**: formulas.html is more comprehensive and better integrated
3. **Poor UX**: Not in navigation, creates confusion about where to find scenarios
4. **Maintenance Burden**: Two pages doing same thing = 2x maintenance effort
5. **No Unique Value**: Every feature is available (and better) in formulas.html

---

## 3. Recommended Actions

### Action 1: Remove scenario-suggestions.html

**Steps:**
1. Delete `scenario-suggestions.html`
2. Update `questionnaire.js` line 280:
   ```javascript
   // OLD:
   window.location.href = 'scenario-suggestions.html';

   // NEW:
   window.location.href = 'formulas.html';
   ```

3. Update documentation files:
   - Remove from `CLAUDE.md` page list (line ~735)
   - Remove from `WEBSITE_CHECK_REPORT.md`
   - Remove from `FORMULA_DATABASE_EXPORT.md`
   - Remove from `PAGE_OPTIMIZATION_SUMMARY.md`

4. Test the questionnaire → redirect flow to ensure formulas.html displays correctly

**Benefits:**
- Eliminates confusion about which page to use
- Reduces maintenance burden
- Improves user experience (better landing page)
- Keeps codebase cleaner

**Risks:**
- Minimal - formulas.html already provides all functionality
- Users currently redirected there will simply go to better page

### Action 2: Keep my-formulas.html (No Changes)

**Rationale:** Provides unique, valuable functionality with no redundancy.

### Action 3: Update CLAUDE.md

Remove `scenario-suggestions.html` from documentation and note that scenario suggestions are integrated into `formulas.html`.

---

## 4. Impact Analysis

### User Impact
- **Positive**: Clearer navigation, single authoritative page for scenarios
- **Negative**: None - better page is the destination
- **Migration**: Automatic via redirect change

### Developer Impact
- **Positive**: Less code to maintain, clearer architecture
- **Negative**: None
- **Effort**: Minimal - delete file + update one redirect

### Performance Impact
- **Positive**: One less page to load/maintain
- **Neutral**: formulas.html already loads all required scripts

---

## 5. Alternative Considerations

### Could my-formulas.html be consolidated?

**Considered:** Merging viewing history into recipe-database.html

**Decision:** No - they serve different purposes:
- `my-formulas.html`: Recently **viewed** preset formulas (browsing history)
- `recipe-database.html`: **Saved** custom recipes (user's creations)

These are complementary, not redundant. Users need both:
- History for rediscovering formulas they explored
- Recipe database for managing their custom creations

---

## 6. Summary Table

| Page | Lines | Purpose | Verdict | Rationale |
|------|-------|---------|---------|-----------|
| **my-formulas.html** | 344 | Viewing history & stats | ✅ **KEEP** | Unique functionality, no duplication |
| **scenario-suggestions.html** | 717 | Scenario timeline display | ❌ **REMOVE** | 100% redundant with formulas.html |

---

## 7. Conclusion

**scenario-suggestions.html should be removed** as it provides no unique value and creates user confusion. The identical functionality is already available in a better, more integrated form via `formulas.html`.

**my-formulas.html should be retained** as it provides unique viewing history functionality that complements the other pages in the application.

### Next Steps
1. Update questionnaire.js redirect: `scenario-suggestions.html` → `formulas.html`
2. Delete scenario-suggestions.html
3. Update documentation to reflect change
4. Test complete user flow from questionnaire through to scenario viewing

---

*Report Generated: November 2025*
*Analyst: Claude Code Assistant*
