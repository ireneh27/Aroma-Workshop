# Aroma-Workshop Codebase Architecture Documentation

> **For AI Assistants:** This document provides a comprehensive guide to the Aroma-Workshop codebase. Read sections 1-6 for architecture understanding, section 12 for quick reference, and section 13 for AI-specific guidelines. Always check the Quick Reference (section 11) before making changes.

## Project Overview

Aroma-Workshop is a personalized aromatherapy guidance web application built with vanilla JavaScript and HTML/CSS. The application helps users create custom essential oil formulas based on their health profiles and provides comprehensive safety guidelines. The project is entirely client-side with localStorage-based data persistence.

**Total Codebase Size:** ~13,700 lines of JavaScript across 20+ modules

**Project Type:** Static web application (HTML/CSS/JS) designed for GitHub Pages deployment

**Primary Language:** Chinese (Simplified) - All UI text, comments, and user-facing content

**Target Users:** Chinese-speaking users seeking personalized aromatherapy guidance

---

## 1. JavaScript Module Structure

### Core System Modules

#### **auth.js** (19.8 KB - Authentication & User Management)
- **Purpose:** User authentication, registration, login, and membership management
- **Key Features:**
  - Email/password registration and login with localStorage persistence
  - WeChat OAuth integration support
  - User profile management with stats (AI inquiries, remaining limits)
  - Membership types: FREE (3 AI queries, 1 profile, 10 recipes) vs PREMIUM (unlimited)
  - Purchase history tracking
  - User-specific data isolation
- **Key Functions:**
  - `registerUser(email, password, name)` - Register new user
  - `loginUser(email, password)` - Authenticate user
  - `setCurrentUser(email)` - Set active session
  - `getCurrentUser()` - Get logged-in user info
  - `isUserLoggedIn()` - Check auth status
  - `getUserStatistics()` - Get user's AI query limits
  - `canCreateProfile()` - Check profile creation limits
  - `consumeAIInquiry()` - Decrement AI query count
- **Storage Keys:** `aromatherapy_users`, `aromatherapy_current_user`

#### **common.js** (3.7 KB - UI/Navigation Utilities)
- **Purpose:** Common UI behaviors and navigation functionality
- **Key Features:**
  - Fixed navigation bar with scroll effects
  - Mobile menu toggle
  - "Back to top" button
  - Intersection observer for fade-in animations
  - Active page highlighting in navigation
- **Module Pattern:** Direct DOM manipulation with event listeners

#### **auth-nav.js** (1.9 KB - Navigation Authentication State)
- **Purpose:** Update navigation bar based on authentication status
- **Key Features:**
  - Dynamic showing/hiding of login link vs user info
  - Display user greeting with AI query count
  - Show "My Formulas" link for logged-in users
  - Poll every 2 seconds for state changes
- **Depends On:** `auth.js`

---

### Data Management Modules

#### **formula-database.js** (55.9 KB - Preset Formula Database)
- **Purpose:** Central database of pre-configured aromatherapy formulas
- **Structure:** `FORMULA_DATABASE` object with formula entries
- **Key Formula Types:**
  - Hand cream formulas (A)
  - Diffuser/air freshener formulas (B, D)
  - Foot bath formulas (C, C1, C2)
  - Body lotion formulas (B1, B2)
  - Period-related formulas (F, G, H)
- **Formula Data Structure:**
  ```javascript
  {
    id: string,
    name: string,
    subtitle: string,
    ingredients: [{ name, amount }],
    usage: string,
    principle: string,
    dailyAmount: string,
    concentration: string (optional),
    matches: string[] (symptom codes),
    gender: string (optional)
  }
  ```
- **Usage:** Imported by formula-suggestions.js, formula-detail.js, and other display modules

#### **oil-database.js** (Large KB - Essential Oil Database)
- **Purpose:** Comprehensive database of 17 essential oils with properties
- **Key Structure:**
  - `OIL_TYPES` - Oil categorization (floral, woody, citrus, herbal, resin, spice, mint)
  - `ESSENTIAL_OILS_DB` - Detailed oil information
- **Oil Data Structure:**
  ```javascript
  {
    name: string,
    latin: string,
    types: string[],
    origin: string,
    extractionMethod: string,
    imageUrl: string,
    properties: { main, symptoms, energy },
    caution: string,
    maxConcentration: number,
    description: string,
    usage: string,
    blending: string
  }
  ```
- **Safety Features:**
  - Safety warnings (pregnancy precautions, allergies, etc.)
  - Maximum concentration limits per oil
  - Extraction method documentation

#### **unified-data-manager.js** (Unknown KB - Data Migration & Format Conversion)
- **Purpose:** Unified storage for recipes from multiple sources
- **Key Features:**
  - Migrate old data from `formula-builder` and `recipe-database`
  - Standardize recipe formats across different sources
  - Convert between formula-builder and unified formats
  - Data persistence with version control
- **Storage:** `unified_recipes_v1` in localStorage
- **Key Methods:**
  - `init()` - Initialize and migrate data
  - `getUnifiedFormat()` - Get standardized recipe schema
  - `convertFromFormulaBuilder(oldFormula)` - Format conversion
  - `getAllRecipes()` - Retrieve all recipes
  - `saveAllRecipes(recipes)` - Persist recipes

---

### Feature-Specific Modules

#### **formula-suggestions.js** (9.4 KB - AI Recommendation Engine)
- **Purpose:** Generate personalized formula recommendations based on health questionnaire
- **Algorithm:**
  - Rule-based matching system (primary)
  - AI-enhanced recommendations (optional, with API support)
  - Symptom scoring and formula ranking
- **Key Functions:**
  - `calculateFormulaScores(questionnaireData)` - Compute match scores
  - `generatePersonalizedSuggestions(questionnaireData, useAI)` - Generate recommendations
  - Gender-based filtering
  - Pregnancy/nursing safety checks
  - Caution-based filtering (hypertension, epilepsy, sensitive skin)
- **Input:** Questionnaire data object
- **Output:** Ranked array of formula objects with explanations
- **Dependencies:** `formula-database.js`

#### **formula-builder.js** (62.1 KB - Custom Formula Creator)
- **Purpose:** Interactive formula builder UI and logic
- **Key Features:**
  - Drag-and-drop oil selection
  - Real-time concentration calculations
  - Safety validation (warn when concentration exceeds limits)
  - Base type selection (base oil, rosewater, ethanol)
  - Save/load formulas from localStorage
  - Edit existing formulas
- **Storage Keys:** `savedFormulas` (legacy), `unified_recipes_v1` (new)
- **Key Functions:**
  - `addOil()` - Add oil to current formula
  - `removeOil()` - Remove oil from formula
  - `calculateConcentration()` - Compute dilution percentage
  - `saveFormula()` - Persist formula to storage
  - `loadSavedFormulas()` - Retrieve saved formulas
- **Data Flow:**
  - Loads essential oils from `oil-database.js`
  - Stores in unified format via `unified-data-manager.js`
  - Validates against `daily-usage-validator.js`

#### **questionnaire.js** (Complex - Health Profile Management)
- **Purpose:** Health questionnaire form and data management
- **Key Features:**
  - Multi-section health questionnaire form
  - User-specific storage with auth integration
  - Progress tracking
  - Form validation and auto-save
  - User-linked data storage
- **Questionnaire Sections:**
  - Demographics (age, gender, pregnancy status)
  - Circulation issues
  - Sleep problems
  - Digestive issues
  - Gynecological issues (female)
  - Body constitution
  - Special cautions
  - Fragrance preferences
- **Storage:** User-specific key: `user_questionnaire_{userId}`
- **Key Functions:**
  - `saveQuestionnaire()` - Persist questionnaire
  - `getQuestionnaireData()` - Retrieve current data
  - `updateProgress()` - Track form completion
  - `validateQuestionnaire()` - Ensure data quality

#### **daily-usage-validator.js** (30.5 KB - Safety Validation)
- **Purpose:** Validate daily essential oil usage against safety limits
- **Key Constants:**
  - `DAILY_SAFETY_LIMIT: 0.6 ml` - Maximum daily skin contact
  - `WARNING_THRESHOLD: 0.5 ml` - Alert threshold
- **Key Functions:**
  - `parseDailyAmount(dailyAmountStr)` - Extract ml from text
  - `getFormulaTotalOilAmount(formula)` - Calculate oil content
  - `validateDailyUsage(formulas)` - Check cumulative safety
  - `getUsageWarning(totalUsage)` - Generate safety alerts
- **Features:**
  - Accounts for absorption rates
  - Handles multiple usage methods (topical, diffusion, bathing)
  - Converts drops to ml (1 drop ≈ 0.05ml)
  - Warns users approaching limits

#### **formula-filter.js** (20.5 KB - Search & Filtering)
- **Purpose:** Filter and search formulas by multiple criteria
- **Key Features:**
  - Filter by symptom/condition
  - Filter by oil type
  - Filter by safety level
  - Text search
  - Multi-criteria filtering
- **Key Functions:**
  - `filterBySymptom(symptom)` - Filter by health condition
  - `filterByOilType(oilType)` - Filter by oil category
  - `filterBySafety(level)` - Filter by safety rating
  - `searchFormulas(query)` - Full-text search
  - `applyFilters(criteria)` - Multi-criteria filtering

#### **formula-detail.js** (21.4 KB - Formula Display)
- **Purpose:** Display detailed information about a single formula
- **Key Features:**
  - Render full formula information
  - Display ingredients with quantities
  - Show usage instructions
  - Display principle/benefits
  - Usage timeline
  - Safety warnings
  - Save to personal library
- **Data Sources:**
  - `FORMULA_DATABASE` (preset formulas)
  - Query parameter: `?id={formulaId}`
  - localStorage for custom formulas

#### **oil-detail.js** (Complex - Oil Information Display)
- **Purpose:** Display detailed information about essential oils
- **Key Features:**
  - Oil properties and origin
  - Benefits and precautions
  - Usage recommendations
  - Blending suggestions
  - Safety warnings with icons

#### **ai-service.js** (44.4 KB - AI Integration)
- **Purpose:** Handle AI API calls for enhanced recommendations
- **Supported Providers:**
  - OpenAI (GPT-4, GPT-3.5-turbo)
  - DeepSeek (deepseek-chat) - Currently configured
  - Anthropic Claude
  - Custom OpenAI-compatible APIs
- **Current Config:** DeepSeek API with hardcoded key
- **Key Features:**
  - Request/response caching (24-hour expiry)
  - Retry logic (up to 3 attempts)
  - Timeout handling (30 seconds)
  - Concurrent request limiting (max 3)
  - localStorage persistence for cache
- **Key Functions:**
  - `callAI(prompt, useCache)` - Make AI request
  - `generatePrompt(type, data)` - Create AI prompts
  - `loadCacheFromStorage()` - Load persistent cache
  - `saveCacheToStorage()` - Save cache to localStorage
- **Storage:** `ai_cache` in localStorage
- **Dependencies:** None (standalone module)

#### **recipe-database.js** (Large - Personal Recipe Management)
- **Purpose:** Manage user's saved recipes and formulas
- **Key Features:**
  - CRUD operations on personal recipes
  - Import/export recipes
  - CSV export functionality
  - Recipe categorization
- **Storage:** `eo_recipes_v1` in localStorage
- **Key Functions:**
  - `addRecipe(recipeData)` - Create new recipe
  - `updateRecipe(id, recipeData)` - Modify recipe
  - `deleteRecipe(id)` - Remove recipe
  - `getRecipes()` - List all recipes
  - `exportToCSV()` - Export recipes as CSV

#### **scenario-suggestions.js** (Complex - Usage Scenario Recommendations)
- **Purpose:** Suggest formulas based on specific usage scenarios
- **Scenarios:** Different times of day, activities, emotional states
- **Integration:** Works with formula-suggestions.js for scenario-specific recommendations

#### **formulas-page.js** (47.5 KB - Timeline Display)
- **Purpose:** Display personalized time-based aromatherapy schedule
- **Key Features:**
  - Generate daily usage timeline based on questionnaire
  - AI-enhanced timeline generation (with weighted prompts)
  - Display formulas in time slots
  - Show usage instructions for each time slot
  - Safety warnings for cumulative usage
- **Weighted AI Prompts:**
  - Gender (1.0)
  - Pregnancy/nursing status (1.0)
  - Symptoms (0.8)
  - Safety cautions (1.0)
  - Usage preferences (0.7)
  - Constitution (0.5)
  - Fragrance preference (0.6)

#### **formula-library.js** (25.6 KB - Browse Formulas)
- **Purpose:** Browse and explore preset formula library
- **Key Features:**
  - Display all formulas in library
  - Filter/search functionality
  - Sort by various criteria
  - Quick view details
  - Save to personal library

#### **essential-oils-page.js** (8.9 KB - Oil Library Display)
- **Purpose:** Display all 17 essential oils with properties
- **Key Features:**
  - Grid layout of oils
  - Oil cards with images
  - Properties and benefits display
  - Safety warnings prominent
  - Click to view detailed information

#### **payment.js** (Complex - E-commerce)
- **Purpose:** Handle payment processing for AI queries and premium membership
- **Payment Methods:**
  - WeChat Pay (primary)
  - Development mode for testing
- **Key Features:**
  - Generate order IDs
  - Process payments
  - Update user limits after payment
  - Track purchase history
  - Handle payment callbacks
- **Parameters:**
  - `type` - 'ai' (for AI queries) or 'premium' (for membership)
  - `amount` - Number of items
  - `price` - Total cost in CNY
- **Key Functions:**
  - `initiateWeChatPay()` - Start payment flow
  - `handlePaymentSuccess(orderId, params)` - Process successful payment
  - `updateUserAfterPurchase()` - Update user limits

#### **preset-recipes.js** (Unknown KB)
- **Purpose:** Likely contains preset recipe templates or examples

#### **recipe-db.js** (Unknown KB)
- **Purpose:** Appears to be related to recipe database operations

#### **safety-evaluator.js** (Unknown KB)
- **Purpose:** Evaluate formula safety and provide warnings

#### **dilution-calculator.js** (1.8 KB - Concentration Calculator)
- **Purpose:** Calculate oil dilution percentages
- **Key Functions:**
  - `calculateDilution(oilAmount, baseAmount)` - Compute percentage
  - `calculateOilAmount(concentration, baseAmount)` - Reverse calculation

---

## 2. Data Management System

### Storage Architecture

The application uses a **multi-layer localStorage-based data persistence system**:

#### **User Data**
```
aromatherapy_users: {
  [email]: {
    id, email, password, name, registeredAt,
    membershipType, aiInquiriesUsed, aiInquiriesLimit,
    lastLogin, loginType, wechatOpenId, purchaseHistory
  }
}
aromatherapy_current_user: email (string)
```

#### **User-Specific Data**
```
user_questionnaire_{userId}: {
  gender, age, pregnancy, symptoms (various categories),
  constitution, cautions, fragrance_preferences
}
user_profiles_{userId}: [{ name, questionnaireId, createdAt }]
user_formulas_{userId}: [{ id, name, ingredients, date }]
```

#### **Global/Shared Data**
```
healthQuestionnaireData: (questionnaire data for non-logged-in users)
eo_recipes_v1: [{ id, name, oils, safetyFlag, source }]
unified_recipes_v1: [{ unified format recipes }]
data_migration_completed: boolean flag
savedFormulas: [{ legacy formula format }]
ai_cache: { [prompt_hash]: { response, timestamp } }
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HTML Pages                                │
├─────────────────────────────────────────────────────────────┤
│ ↓                    ↓                    ↓                   │
├──────────────────┬──────────────────┬──────────────────┐     │
│ questionnaire.js │ formula-builder  │ formula-library  │     │
│                  │     .js          │      .js         │     │
└────────┬─────────┴────────┬─────────┴────────┬────────┘     │
         ↓                  ↓                   ↓               │
    ┌────────────────────────────────┐                         │
    │   auth.js (User Management)    │                         │
    └────────────────┬───────────────┘                         │
         ┌───────────┴──────────┬──────────────┐               │
         ↓                      ↓              ↓                │
    ┌──────────┐     ┌──────────────────┐  ┌────────────┐     │
    │ auth.js  │     │unified-data-     │  │ recipe-    │     │
    │          │     │manager.js        │  │ database   │     │
    └──────┬───┘     │                  │  │    .js     │     │
           ↓         └────────┬─────────┘  └────┬───────┘     │
         localStorage         ↓                 ↓              │
                        User Recipes    Personal Recipes       │
```

### Data Migration Strategy

The application includes a migration system to handle format evolution:

1. **Initial Load:** Check `data_migration_completed` flag
2. **Migration Process:**
   - Migrate `formula-builder` data from `savedFormulas`
   - Migrate `recipe-database` data from `eo_recipes_v1`
   - Convert to unified format
   - Mark migration as complete
3. **Fallback:** Old storage keys remain accessible for backward compatibility

---

## 3. Authentication System

### Architecture Overview

The auth system is a **client-side, localStorage-based system** with WeChat OAuth support.

### User Lifecycle

#### Registration Flow
```
1. User fills registration form
2. registerUser(email, password, name) validates input
3. Check if email exists in aromatherapy_users
4. If new: Create user object with:
   - Unique userId
   - MEMBERSHIP_TYPE.FREE (default)
   - aiInquiriesLimit = 3
   - registeredAt = current time
5. Store in localStorage['aromatherapy_users']
6. Auto-login: setCurrentUser(email)
7. Redirect to home or next step
```

#### Login Flow
```
1. User enters email and password
2. loginUser(email, password) validates
3. Check credentials against localStorage['aromatherapy_users']
4. If valid: setCurrentUser(email) → save to 'aromatherapy_current_user'
5. Return success with user object
6. Update navigation via auth-nav.js
```

#### Session Management
```
- Current user stored in: localStorage['aromatherapy_current_user']
- Checked on every page via: window.authSystem.isUserLoggedIn()
- Updated by: auth-nav.js polling every 2 seconds
- Persists across browser sessions (localStorage)
```

### Membership System

#### Free Member (MEMBERSHIP_TYPE.FREE)
```
- Max profiles: 1
- Max recipes: 10
- AI queries: 3 (free)
- Purchase: Can buy 10 more queries for ¥5
```

#### Premium Member (MEMBERSHIP_TYPE.PREMIUM)
```
- Max profiles: Unlimited
- Max recipes: Unlimited
- AI queries: 30 (gifted) + purchased amounts
- No purchase limits
```

### AI Query Quota System

```
aiInquiriesUsed: Track consumed queries
aiInquiriesLimit: Current user's limit
remainingInquiries: aiInquiriesLimit - aiInquiriesUsed

consumeAIInquiry() {
  if (remainingInquiries > 0) {
    increment aiInquiriesUsed
    return true
  }
  return false
}
```

### Security Notes

**⚠️ IMPORTANT:** Current implementation stores passwords in **plain text** in localStorage. For production:
- Implement server-side authentication
- Use secure session tokens
- Hash passwords with bcrypt/Argon2
- Use secure HTTPOnly cookies
- Implement CSRF protection

---

## 4. Code Patterns & Conventions

### Naming Conventions

#### JavaScript Files
- **kebab-case** for filenames: `formula-builder.js`, `daily-usage-validator.js`
- **camelCase** for function names: `calculateFormulaScores()`, `isUserLoggedIn()`
- **CONSTANT_CASE** for constants: `DAILY_SAFETY_LIMIT`, `AUTH_STORAGE_KEY`
- **PascalCase** for objects that act like modules: `UnifiedDataManager`, `DailyUsageValidator`

#### Data Objects
- Database objects: `FORMULA_DATABASE`, `ESSENTIAL_OILS_DB`
- Configuration objects: `AI_CONFIG`, `OIL_TYPES`, `MEMBERSHIP_TYPE`
- Storage keys (all caps with underscores): `QUESTIONNAIRE_STORAGE_KEY`, `USER_QUESTIONNAIRE_PREFIX`

### Module Patterns

#### Pattern 1: Simple Function Collection
```javascript
// formula-suggestions.js
function calculateFormulaScores(questionnaireData) { ... }
function generatePersonalizedSuggestions(questionnaireData) { ... }
```
- No closure
- Functions added to global scope
- Used for utility/helper functions

#### Pattern 2: Object-Based Module
```javascript
// unified-data-manager.js (partial)
const UnifiedDataManager = {
  UNIFIED_RECIPES_KEY: 'unified_recipes_v1',
  init() { ... },
  migrateOldData() { ... },
  getUnifiedFormat() { ... }
};
```
- Methods organized in object
- Semi-namespaced (prevents global pollution)
- Used for complex multi-method modules

#### Pattern 3: localStorage-Based Data Layer
```javascript
function getAllUsers() {
  return localStorage.getItem(AUTH_STORAGE_KEY)
    ? JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY))
    : {};
}

function saveAllUsers(users) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
}
```
- Getter/setter pair pattern
- JSON serialization
- Used throughout auth.js and questionnaire.js

### Common Code Patterns

#### Event Listener Registration
```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize page content
  updateNavAuthStatus();
  loadSavedFormulas();
});
```

#### DOM Query & Manipulation
```javascript
const element = document.getElementById('elementId');
if (element) {
  element.style.display = 'block';
  element.innerHTML = htmlContent;
}
```

#### Array Operations (Functional Style)
```javascript
const recommendations = Object.entries(scores)
  .filter(([_, score]) => score > 0)
  .sort(([_, a], [__, b]) => b - a)
  .slice(0, 5)
  .map(([formulaId]) => FORMULA_DATABASE[formulaId]);
```

#### Configuration Objects
```javascript
const AI_CONFIG = {
  provider: 'deepseek',
  deepseek: {
    apiKey: '...',
    baseURL: '...',
    model: '...'
  },
  enableCache: true,
  cacheExpiry: 24 * 60 * 60 * 1000
};
```

#### Error Handling
```javascript
try {
  const data = JSON.parse(localStorage.getItem(key));
  return data;
} catch (e) {
  console.warn('Failed to parse:', e);
  return null;
}
```

#### Timeout/Delay Pattern
```javascript
setTimeout(() => {
  updateNavAuthStatus();
}, 2000); // Check every 2 seconds

setInterval(() => {
  checkForUpdates();
}, 5000); // Repeat every 5 seconds
```

#### Conditional Rendering
```javascript
let html = '<h1>Title</h1>';
if (hasData) {
  html += '<p>Additional content</p>';
}
element.innerHTML = html;
```

---

## 5. Dependencies & External Libraries

### No External Frameworks
The entire application is built with **vanilla JavaScript** - no frontend frameworks used.

### External APIs

#### AI Services (Optional)
- **DeepSeek** (Currently configured)
  - API endpoint: https://api.deepseek.com/v1
  - Model: deepseek-chat
  - Used for: Enhanced formula recommendations

- **OpenAI** (Alternative)
  - API endpoint: https://api.openai.com/v1
  - Models: gpt-4, gpt-4o-mini, gpt-3.5-turbo
  - Configured but not active

- **Anthropic Claude** (Alternative)
  - API endpoint: https://api.anthropic.com/v1
  - Models: claude-3-opus, claude-3-haiku
  - Configured but not active

#### Payment Services
- **WeChat Pay** - Primary payment provider
  - API for mobile/QR code payments
  - Callback handling via `wechat-callback.html`

#### Image Services
- **Unsplash API** - Free stock photos
  - Used for essential oil images in database
  - Example: `https://images.unsplash.com/photo-[id]?w=600&h=400&fit=crop`

### Styling
- **Custom CSS** (`styles.css` - 57.4 KB)
  - No CSS framework (Bootstrap, Tailwind, etc.)
  - CSS variables for theming
  - Responsive design with media queries
  - CSS Grid and Flexbox for layouts

### Browser APIs Used
- **localStorage** - Primary data persistence
- **Fetch API** - AI API calls (in ai-service.js)
- **IntersectionObserver API** - Scroll animations
- **FormData API** - Form handling (questionnaire)
- **URLSearchParams** - Query parameter parsing
- **Date objects** - Timestamps and calculations

---

## 6. HTML Pages Structure

### Pages by Category

#### Main Navigation Pages

| File | Title | Purpose |
|------|-------|---------|
| `index.html` | 个性化芳疗方案 | Home page with hero section, feature cards, personalized welcome |
| `health-profile.html` | 您的信息档案 | Questionnaire form for health assessment |
| `essential-oils.html` | 常用精油介绍 | Essential oil library with 17 oils |
| `formula-library.html` | 经典配方库 | Browse preset formula database |
| `formula-builder.html` | 配方实验器 | Interactive formula creation tool |
| `formulas.html` | 您的定制芳疗体验 | Time-based personalized recommendations |
| `recipe-database.html` | 您的私人配方库 | Manage saved custom recipes |
| `my-formulas.html` | 我的配方库 | Personal formula library (logged-in only) |
| `making.html` | 制作指南 | Step-by-step formula making instructions |
| `safety.html` | 安全使用须知 | Safety guidelines and precautions |

#### Support Pages

| File | Title | Purpose |
|------|-------|---------|
| `login.html` | 登录/注册 | User authentication page |
| `payment.html` | 微信支付 | Payment processing for AI queries/premium |
| `wechat-callback.html` | 微信登录回调 | WeChat OAuth callback handler |
| `formula-detail.html` | 配方详情 | Display single formula details |
| `oil-detail.html` | 精油详情 | Display single oil details |
| `scenario-suggestions.html` | 综合使用场景建议 | Usage scenario recommendations |

#### Reference Pages

| File | Title | Purpose |
|------|-------|---------|
| `aromatherapy_guide.html` | 个性化芳疗方案使用指南 | Comprehensive guide (59 KB) |
| `aromatherapy_guide_optimized.html` | Optimized version | Performance-improved guide |
| `精油配方数据库（html_单文件）.html` | Single-file version | All-in-one database reference |

#### Backup

| File | Purpose |
|------|---------|
| `index_original_backup.html` | Original homepage backup |

### Page Load Dependencies

Every page typically loads these core scripts in order:
```html
<script src="common.js"></script>          <!-- Navigation & UI -->
<script src="auth.js"></script>             <!-- Auth system -->
<script src="auth-nav.js"></script>         <!-- Nav state update -->
```

Additional scripts loaded based on page function:
```html
<!-- For formula display -->
<script src="formula-database.js"></script>
<script src="formula-suggestions.js"></script>
<script src="daily-usage-validator.js"></script>

<!-- For health questionnaire -->
<script src="questionnaire.js"></script>

<!-- For formula creation -->
<script src="formula-builder.js"></script>
<script src="oil-database.js"></script>
<script src="unified-data-manager.js"></script>

<!-- For AI features -->
<script src="ai-service.js"></script>
<script src="formulas-page.js"></script>

<!-- For payments -->
<script src="payment.js"></script>
```

### Page Flow Architecture

```
index.html (Entry Point)
├── health-profile.html → Questionnaire
│   └── formulas.html → Personalized Timeline
│
├── essential-oils.html → Oil Library
│   └── oil-detail.html?id={oilName} → Oil Details
│
├── formula-library.html → Browse Presets
│   └── formula-detail.html?id={formulaId} → Formula Details
│       └── recipe-database.html → Save to Library
│
├── formula-builder.html → Create Custom Formula
│   └── recipe-database.html → Save Custom Formula
│
├── my-formulas.html → Personal Formulas (Auth Only)
│
├── making.html → Making Instructions
│
├── safety.html → Safety Guidelines
│
└── login.html → Authentication
    └── payment.html → Purchase AI/Premium
```

---

## 7. Key Architectural Features

### Safety-First Design
- Daily usage validation (max 0.6ml skin contact)
- Oil-specific concentration limits
- Pregnancy/nursing special handling
- Allergy and medical condition checking
- Gender-specific formula recommendations

### Personalization Engine
- Rule-based formula matching (primary)
- AI-enhanced recommendations (optional)
- Time-based daily schedules
- User preference learning
- Weighted symptom scoring

### Multi-User Support
- User registration and authentication
- Per-user data isolation
- Membership tiers (Free/Premium)
- Profile management (up to 1 for free users, unlimited for premium)
- Purchase history tracking

### Data Persistence
- localStorage-based (no server required)
- Automatic data migration from old formats
- Cache system for API calls
- Graceful degradation if localStorage unavailable

### Content Management
- 17 essential oils database
- 20+ preset formulas
- 7+ oil types/categories
- Configurable formula attributes
- Symptom-to-remedy mapping

---

## 8. Current Limitations & Technical Debt

### Security Issues
- Passwords stored in plain text (localStorage)
- No input validation/sanitization in some areas
- XSS vulnerability potential in innerHTML usage
- API keys exposed in client-side code (ai-service.js line 20)

### Architecture Issues
- No module bundling or optimization
- Global scope pollution (functions defined globally)
- No error boundary patterns
- Missing TypeScript/type safety
- No testing framework

### Data Management Issues
- No conflict resolution for multi-tab access
- localStorage size limits (~5-10MB per domain)
- No backup/restore functionality
- Data migration complexity

### Performance Issues
- All data loaded in memory
- No pagination for large datasets
- No lazy loading of images
- No service worker for offline support

### UI/UX Issues
- Mobile responsiveness could be improved
- No loading states in many async operations
- Error messages not consistently styled
- No offline mode

---

## 9. Development Guidelines

### Adding a New Feature

1. **Create Feature Module**
   ```javascript
   // new-feature.js
   const NewFeatureModule = {
     init() { ... },
     process(data) { ... }
   };
   ```

2. **Add to HTML**
   ```html
   <script src="new-feature.js"></script>
   ```

3. **Update auth.js if user-specific**
   ```javascript
   // Add to user limits or checks
   ```

4. **Update questionnaire.js if health-related**
   ```javascript
   // Add to questionnaire data structure
   ```

5. **Test with multiple users** (if auth-related)

### Debugging Tips

- Check `localStorage` in browser DevTools
- Monitor `window.authSystem` for auth state
- Use `console.log()` extensively (no logging framework)
- Check `FORMULA_DATABASE` for formula data
- Verify `ESSENTIAL_OILS_DB` for oil properties

### Browser Compatibility
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6 support (arrow functions, template literals)
- localStorage required
- Fetch API for AI calls

---

## 10. File Size Summary

```
Large Modules (>30 KB):
- formula-database.js: 55.9 KB
- formula-builder.js: 62.1 KB
- ai-service.js: 44.4 KB
- formulas-page.js: 47.5 KB

Medium Modules (10-30 KB):
- auth.js: 19.8 KB
- formula-library.js: 25.6 KB
- formula-detail.js: 21.4 KB
- formula-filter.js: 20.5 KB
- daily-usage-validator.js: 30.5 KB

Small Modules (<10 KB):
- common.js: 3.7 KB
- auth-nav.js: 1.9 KB
- dilution-calculator.js: 1.8 KB
- essential-oils-page.js: 8.9 KB
- formula-suggestions.js: 9.4 KB

CSS:
- styles.css: 57.4 KB

Total JavaScript: ~13,738 lines
```

---

## 11. Quick Reference

### Most Important Files for Understanding Architecture
1. **auth.js** - User system foundation
2. **formula-database.js** - Content database
3. **formula-suggestions.js** - Recommendation engine
4. **oil-database.js** - Oil properties and safety
5. **daily-usage-validator.js** - Safety calculations

### Entry Points
- **index.html** - Home page
- **health-profile.html** - Start questionnaire
- **login.html** - Authentication

### Key Functions to Know
- `window.authSystem.isUserLoggedIn()`
- `calculateFormulaScores(questionnaireData)`
- `generatePersonalizedSuggestions(questionnaireData)`
- `DailyUsageValidator.validateDailyUsage(formulas)`
- `UnifiedDataManager.getAllRecipes()`

---

## 12. Development Workflow & Testing

### Local Development Setup

#### Option 1: Python HTTP Server (Recommended)
```bash
cd /home/user/Aroma-Workshop
python3 -m http.server 8000
# Visit http://localhost:8000
```

#### Option 2: Using Provided Script
```bash
./start-server.sh
# Starts server on port 8000
```

#### Option 3: Live Server (VS Code)
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

### Testing Guidelines

#### Basic Functionality Test
1. **Page Load Test**
   - Open each HTML page and check for console errors
   - Verify all scripts load in correct order
   - Check that navigation works correctly

2. **Authentication Test**
   - Register new user via `login.html`
   - Verify user data saved to localStorage
   - Check login persistence across pages
   - Test logout functionality

3. **Questionnaire Test**
   - Fill out `health-profile.html` questionnaire
   - Verify data saved with key `user_questionnaire_{userId}`
   - Check that at least one usage method is selected
   - Confirm progress tracking works

4. **Formula Recommendation Test**
   - Complete questionnaire first
   - Visit `formulas.html`
   - Check personalized recommendations appear
   - Verify safety warnings display correctly
   - Test daily usage validation (max 0.6ml)

5. **AI Features Test** (if configured)
   - Ensure user is logged in with available queries
   - Check scenario suggestions load on `formulas.html`
   - Verify AI responses are cached (24 hours)
   - Monitor API calls in Network tab

6. **Formula Builder Test**
   - Create custom formula in `formula-builder.html`
   - Verify concentration calculations
   - Check safety warnings for high concentrations
   - Save formula and verify it appears in `recipe-database.html`

#### Testing Checklist
```javascript
// Browser Console Quick Tests

// 1. Check if databases loaded
console.log('Formula DB loaded:', typeof FORMULA_DATABASE !== 'undefined');
console.log('Oil DB loaded:', typeof ESSENTIAL_OILS_DB !== 'undefined');

// 2. Check auth state
console.log('Logged in:', window.authSystem?.isUserLoggedIn());
console.log('User:', window.authSystem?.getCurrentUser());

// 3. Check questionnaire data
const qData = getQuestionnaireData();
console.log('Questionnaire data:', qData);
console.log('Has usage methods:', qData?.usage?.length > 0);

// 4. Check AI config
console.log('AI provider:', AI_CONFIG?.provider);
console.log('AI enabled:', AI_CONFIG?.provider !== 'none');

// 5. Check data migration
console.log('Migration done:', localStorage.getItem('data_migration_completed'));
```

### Common Testing Scenarios

#### Scenario 1: New User Registration → Recommendation Flow
1. Clear localStorage: `localStorage.clear()`
2. Go to `login.html` → Register new user
3. Go to `health-profile.html` → Complete questionnaire
4. Go to `formulas.html` → View personalized timeline
5. Check AI query count decrements

#### Scenario 2: Formula Creation → Save → View
1. Log in as existing user
2. Go to `formula-builder.html`
3. Add oils and create formula
4. Save with name and notes
5. Go to `recipe-database.html`
6. Verify formula appears in list

#### Scenario 3: Payment Flow (Dev Mode)
1. Use up free AI queries (3 for free users)
2. Try to use AI feature → See purchase prompt
3. Click "Purchase 10 queries for ¥5"
4. Go to `payment.html`
5. In dev mode, payment auto-succeeds
6. Verify AI query count increased by 10

### Browser Compatibility Testing

**Minimum Requirements:**
- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- ES6 support (arrow functions, template literals, destructuring)
- localStorage API
- Fetch API
- IntersectionObserver API (for animations)

**Known Issues:**
- IE11 not supported (uses ES6+ features)
- Private browsing may have localStorage limitations
- Some mobile browsers may have 5MB localStorage limit

---

## 13. Git Workflow & Deployment

### Git Practices

#### Branch Naming Convention
- Main branch: `main` (production)
- Feature branches: `claude/claude-md-{sessionId}` or `feature/{feature-name}`
- Hotfix branches: `hotfix/{issue-description}`

#### Commit Message Guidelines
```bash
# Good commit messages:
git commit -m "Add AI caching mechanism to reduce API calls"
git commit -m "Fix daily usage validator calculation error"
git commit -m "Update formula database with 3 new formulas"

# Avoid vague messages:
git commit -m "Update files"
git commit -m "Fix bug"
```

#### Making Commits
```bash
# Check status
git status

# Stage specific files
git add ai-service.js formula-database.js

# Commit with descriptive message
git commit -m "Implement DeepSeek API integration for formula recommendations"

# Push to remote
git push -u origin claude/claude-md-{sessionId}
```

### Deployment to GitHub Pages

#### First-Time Setup
1. Push code to GitHub repository
2. Go to Settings → Pages
3. Source: Deploy from branch `main`
4. Folder: `/ (root)`
5. Save and wait for deployment

#### Deployment Workflow
```bash
# 1. Make changes locally
# 2. Test thoroughly
./start-server.sh  # Test locally

# 3. Commit changes
git add .
git commit -m "Descriptive message"

# 4. Push to main branch
git push origin main

# 5. GitHub Pages auto-deploys (usually takes 1-2 minutes)
# 6. Visit: https://{username}.github.io/{repo-name}
```

#### Pre-Deployment Checklist
- [ ] All console.log statements removed or minimized
- [ ] No API keys exposed in client-side code
- [ ] All links use relative paths (not absolute localhost)
- [ ] Tested on multiple browsers
- [ ] Mobile responsiveness verified
- [ ] No broken internal links
- [ ] localStorage usage documented for users

---

## 14. Guidelines for AI Assistants

### Understanding the Codebase

#### Before Making Changes
1. **Read relevant sections** of this document
2. **Check existing patterns** in similar files
3. **Verify dependencies** between modules
4. **Test locally** before committing
5. **Review security implications** (especially for auth/payment)

#### Key Principles
1. **Safety First**: Never compromise safety validations (daily limits, pregnancy checks)
2. **Maintain Chinese UI**: All user-facing text must be in Chinese
3. **Preserve Vanilla JS**: Do not introduce frameworks without discussion
4. **Backward Compatibility**: Ensure data migration works for existing users
5. **localStorage Limits**: Be mindful of 5-10MB storage limits

### Common Tasks

#### Task: Add a New Formula to Database
```javascript
// 1. Edit formula-database.js
// 2. Add new entry to FORMULA_DATABASE object
'NEW_ID': {
  id: 'NEW_ID',
  name: '配方名称',
  subtitle: '适用场景',
  ingredients: [
    { name: '薰衣草', amount: '3滴' },
    { name: '甜橙', amount: '2滴' }
  ],
  usage: '使用说明...',
  principle: '配方原理...',
  dailyAmount: '每天2次，每次1ml',
  matches: ['symptom_code_1', 'symptom_code_2'],
  gender: 'both' // or 'female', 'male'
}

// 3. Test by loading formula-library.html
// 4. Verify formula appears and details load correctly
```

#### Task: Add a New Essential Oil
```javascript
// 1. Edit oil-database.js
// 2. Add to ESSENTIAL_OILS_DB array
{
  name: '新精油名称',
  latin: 'Latin Name',
  types: ['woody'], // or 'floral', 'citrus', etc.
  origin: '产地',
  extractionMethod: '蒸馏法',
  imageUrl: 'https://images.unsplash.com/photo-xxx',
  properties: {
    main: '主要功效',
    symptoms: '适用症状',
    energy: '能量属性'
  },
  caution: '⚠️ 注意事项',
  maxConcentration: 2.0, // percentage
  description: '详细描述',
  usage: '使用方法',
  blending: '调香建议'
}

// 3. Test in essential-oils.html and oil-detail.html
```

#### Task: Modify AI Prompt
```javascript
// 1. Edit ai-service.js
// 2. Find the relevant function (e.g., generateScenarioSuggestions)
// 3. Modify the prompt string
// 4. Test with actual AI API call
// 5. Verify JSON response parses correctly
// 6. Check token usage (stay under maxTokens limit)

// Example:
const prompt = `
作为专业芳疗师，请根据以下健康状况：
${JSON.stringify(questionnaireData, null, 2)}

生成2个使用场景建议，包含每日时间安排。
输出JSON格式：
{
  "scenarios": [
    {
      "name": "场景名称",
      "timeline": [...]
    }
  ]
}
`;
```

#### Task: Fix a Bug in Authentication
```javascript
// 1. Locate bug in auth.js
// 2. Add console.log to trace execution
// 3. Check localStorage data structure
// 4. Test with multiple users
// 5. Ensure backward compatibility
// 6. Clear localStorage and test fresh registration

// Common auth debugging:
console.log('All users:', getAllUsers());
console.log('Current user:', getCurrentUser());
console.log('Is logged in:', isUserLoggedIn());
console.log('Can use AI:', canUseAIInquiry());
```

#### Task: Add New Page
```html
<!-- 1. Create new-page.html -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面标题</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Navigation (copy from index.html) -->

    <div class="container">
        <h1>页面标题</h1>
        <!-- Content here -->
    </div>

    <!-- Core scripts (always in this order) -->
    <script src="common.js"></script>
    <script src="auth.js"></script>
    <script src="auth-nav.js"></script>

    <!-- Page-specific scripts -->
    <script src="new-feature.js"></script>
</body>
</html>

<!-- 2. Add navigation link in all other HTML files -->
<!-- 3. Update new-page.js with functionality -->
<!-- 4. Test navigation and functionality -->
```

### Code Quality Standards

#### JavaScript Style
```javascript
// ✅ Good
function calculateDilution(oilAmount, baseAmount) {
  if (!oilAmount || !baseAmount) {
    console.warn('Invalid amounts provided');
    return 0;
  }

  const percentage = (oilAmount / (oilAmount + baseAmount)) * 100;
  return Math.round(percentage * 100) / 100; // 2 decimal places
}

// ❌ Avoid
function calc(a,b){return a/b*100;} // No validation, unclear names
```

#### HTML Structure
```html
<!-- ✅ Good -->
<div class="formula-card" data-formula-id="A">
  <h3 class="formula-name">配方名称</h3>
  <p class="formula-description">配方描述</p>
  <button class="btn-primary" onclick="saveFormula('A')">保存</button>
</div>

<!-- ❌ Avoid -->
<div onclick="save('A')"><h3>配方</h3></div> <!-- Inline handlers, unclear structure -->
```

#### CSS Patterns
```css
/* ✅ Good - Use CSS variables */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
}

.button-primary {
  background: var(--primary-color);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
}

/* ❌ Avoid - Hardcoded colors */
.btn {
  background: #667eea;
}
```

### Security Considerations

#### What NOT to Do
1. **Never** commit real API keys to repository
2. **Never** store passwords in plain text (current implementation needs fixing)
3. **Never** trust user input without validation
4. **Never** use `eval()` or `new Function()` with user data
5. **Never** expose sensitive data in client-side code

#### Safe Practices
```javascript
// ✅ Good - Validate input
function registerUser(email, password, name) {
  if (!email || !email.includes('@')) {
    return { success: false, error: '无效邮箱' };
  }
  if (!password || password.length < 6) {
    return { success: false, error: '密码至少6位' };
  }
  // Proceed with registration
}

// ✅ Good - Escape HTML
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ✅ Good - Use textContent for user input
element.textContent = userInput; // Safe
// element.innerHTML = userInput; // ❌ XSS risk
```

### Error Handling Best Practices

```javascript
// ✅ Good - Comprehensive error handling
async function loadFormulaData() {
  try {
    const data = localStorage.getItem('formulas');
    if (!data) {
      console.warn('No formula data found, using defaults');
      return getDefaultFormulas();
    }

    const parsed = JSON.parse(data);
    return validateFormulaData(parsed) ? parsed : getDefaultFormulas();

  } catch (error) {
    console.error('Failed to load formula data:', error);
    // Show user-friendly message
    showNotification('加载配方数据失败，使用默认配方', 'warning');
    return getDefaultFormulas();
  }
}

// ❌ Avoid - Silent failures
function loadData() {
  try {
    return JSON.parse(localStorage.getItem('data'));
  } catch (e) {
    return null; // User has no idea what went wrong
  }
}
```

### Performance Optimization

#### localStorage Best Practices
```javascript
// ✅ Good - Cache parsed data
let cachedFormulas = null;

function getFormulas() {
  if (cachedFormulas) return cachedFormulas;

  const data = localStorage.getItem('formulas');
  cachedFormulas = data ? JSON.parse(data) : [];
  return cachedFormulas;
}

function saveFormulas(formulas) {
  cachedFormulas = formulas;
  localStorage.setItem('formulas', JSON.stringify(formulas));
}

// ❌ Avoid - Parse on every access
function getFormula(id) {
  const all = JSON.parse(localStorage.getItem('formulas')); // Slow!
  return all.find(f => f.id === id);
}
```

#### DOM Manipulation
```javascript
// ✅ Good - Build HTML string, insert once
let html = '';
formulas.forEach(formula => {
  html += `<div class="card">${formula.name}</div>`;
});
container.innerHTML = html;

// ❌ Avoid - Multiple DOM operations
formulas.forEach(formula => {
  const div = document.createElement('div');
  div.className = 'card';
  div.textContent = formula.name;
  container.appendChild(div); // Triggers reflow each time
});
```

### Troubleshooting Guide

#### Problem: "FORMULA_DATABASE is not defined"
**Cause:** Script load order incorrect or file not loaded
**Solution:**
1. Check `formula-database.js` loads before scripts that use it
2. Verify file path is correct
3. Check Network tab for 404 errors
4. Ensure script tag has correct src attribute

#### Problem: "Cannot read property 'isUserLoggedIn' of undefined"
**Cause:** `auth.js` not loaded or `authSystem` not initialized
**Solution:**
1. Ensure `auth.js` is included before scripts that use it
2. Check if `window.authSystem` object exists
3. Verify `initAuthSystem()` is called on page load

#### Problem: localStorage quota exceeded
**Cause:** Too much data stored (>5MB typically)
**Solution:**
1. Check localStorage size: `JSON.stringify(localStorage).length`
2. Clear old AI cache: `localStorage.removeItem('ai_cache')`
3. Implement data cleanup on old entries
4. Consider pagination for large datasets

#### Problem: AI responses not caching
**Cause:** Cache key generation or storage issue
**Solution:**
1. Check `ai-service.js` cache functions
2. Verify `enableCache: true` in AI_CONFIG
3. Check localStorage for `ai_cache` key
4. Ensure cache expiry logic works correctly

#### Problem: Formulas not appearing after save
**Cause:** Data not syncing between modules
**Solution:**
1. Check if `unified-data-manager.js` is loaded
2. Verify `data_migration_completed` flag
3. Check both old and new storage keys
4. Use UnifiedDataManager methods instead of direct localStorage

### Related Documentation Files

This repository contains several documentation files that provide additional context:

- **AI_SETUP.md** - AI API configuration guide (OpenAI, Claude, DeepSeek)
- **AI_CALL_FLOW.md** - Detailed AI call flow and integration points
- **AI_CALL_SUMMARY.md** - Summary of AI features and usage
- **FEATURES.md** - Feature list (authentication, payment, AI integration)
- **WECHAT_SETUP.md** - WeChat login and payment setup guide
- **LOCAL_TESTING.md** - Comprehensive local testing procedures
- **IMPROVEMENTS.md** - Data management improvements and migration
- **DATA_ANALYSIS.md** - Data structure analysis
- **DESIGN_OPTIMIZATION.md** - UI/UX optimization notes
- **PAGE_OPTIMIZATION_SUMMARY.md** - Performance optimization summary
- **FUNCTIONALITY_CHECK.md** - Functionality verification checklist
- **WEBSITE_CHECK_REPORT.md** - Latest website status report
- **FORMULA_DATABASE_EXPORT.md** - Formula database export documentation
- **formula-numbering.md** - Formula numbering system documentation

**Always check these files** before making significant changes to related features.

### Communication Guidelines

When providing updates to users:
- Be concise and clear
- Use Chinese for user-facing text
- Provide file paths with line numbers when referencing code
- Explain both what changed and why
- Include testing steps when relevant
- Mention any breaking changes or migration needs

Example:
```
✅ Good response:
"I've updated the AI service configuration in ai-service.js:20 to use DeepSeek
instead of OpenAI. This change reduces API costs by ~70% while maintaining
similar response quality.

Changes made:
- ai-service.js:20 - Updated AI_CONFIG.provider to 'deepseek'
- ai-service.js:45 - Added DeepSeek API endpoint configuration

To test: Visit formulas.html after completing the questionnaire and verify that
scenario suggestions still load correctly."

❌ Avoid:
"Updated the AI stuff to use DeepSeek. Should work now."
```

---

## 15. Quick Command Reference

### Development Commands
```bash
# Start local server
python3 -m http.server 8000
# or
./start-server.sh

# Test website functionality
./test-website.sh

# Check for errors (if script exists)
./test-check.js
```

### Git Commands
```bash
# Check current status
git status

# Create and switch to feature branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "Descriptive commit message"

# Push to remote
git push -u origin branch-name

# Pull latest changes
git pull origin main
```

### Browser Console Commands
```javascript
// Clear all localStorage
localStorage.clear();

// Check specific storage key
localStorage.getItem('aromatherapy_users');

// Get current user info
window.authSystem.getCurrentUser();

// Check formula database
Object.keys(FORMULA_DATABASE).length;

// Test AI call
generateScenarioSuggestions(getQuestionnaireData());

// Check data migration status
localStorage.getItem('data_migration_completed');
```

---

*Documentation generated: November 2025*
*Last updated: November 2025*
*For latest updates, refer to WEBSITE_CHECK_REPORT.md and other .md files in project root*
