# 🔒 Security & Privacy Report - User Information Storage

## ⚠️ CRITICAL SECURITY ISSUES

### 1. **Passwords Stored in Plain Text** 🔴 CRITICAL
**Location**: `auth.js` line 67
```javascript
password: password, // 注意：实际应用中应该加密存储
```

**Issue**: User passwords are stored in plain text in localStorage, making them vulnerable to:
- XSS attacks
- Browser extension access
- Local storage inspection
- Data breaches

**Risk Level**: 🔴 **CRITICAL** - Immediate action required before public launch

**Recommendation**:
- **DO NOT** store passwords in plain text
- Use password hashing (bcrypt, argon2) on a backend server
- Implement proper authentication flow with secure tokens
- Consider using OAuth providers (Google, GitHub, etc.)

---

### 2. **All User Data in Browser localStorage** 🔴 CRITICAL
**Location**: Multiple files using localStorage

**Stored Data Includes**:
- User email addresses
- Plain text passwords
- Health questionnaire data (sensitive medical information)
- User profiles with personal information
- Purchase history
- AI inquiry usage
- Recipe data

**Issues**:
- Data is accessible to any JavaScript on the page
- Vulnerable to XSS attacks
- No server-side validation
- Data can be easily modified by users
- No backup or recovery mechanism
- Data lost if user clears browser data

**Risk Level**: 🔴 **CRITICAL** - Not suitable for production

**Recommendation**:
- Move sensitive data to a secure backend database
- Use encrypted connections (HTTPS)
- Implement proper access controls
- Add data validation on server-side
- Implement backup and recovery

---

### 3. **API Keys Exposed in Frontend Code** 🔴 CRITICAL
**Location**: `ai-service.js` line 20
```javascript
apiKey: 'sk-5f6238c8a43741afa79a51dee16b6b27',
```

**Issue**: API keys are visible in client-side JavaScript, allowing:
- Anyone to extract and use your API keys
- Unauthorized API usage and cost
- Key theft and abuse

**Risk Level**: 🔴 **CRITICAL** - Immediate action required

**Recommendation**:
- **Remove API keys from frontend code immediately**
- Use a backend proxy server for API calls
- Store keys in environment variables (server-side only)
- Implement API key rotation
- Use API key restrictions (IP whitelist, rate limiting)

---

### 4. **Sensitive Health Data in localStorage** 🟡 HIGH
**Location**: `questionnaire.js`

**Stored Health Information**:
- Age, gender
- Pregnancy status
- Medical conditions (circulation, sleep, digestive, gynecological)
- Health concerns and cautions
- Personal health profiles

**Issues**:
- Health data is sensitive personal information
- May be subject to GDPR/HIPAA regulations
- No encryption
- No consent mechanism
- No data retention policy

**Risk Level**: 🟡 **HIGH** - Legal and privacy concerns

**Recommendation**:
- Implement proper consent forms
- Encrypt health data
- Add data retention policies
- Provide data export/deletion options
- Consider GDPR compliance requirements
- Add privacy policy and terms of service

---

### 5. **No Input Validation** 🟡 HIGH
**Issues**:
- No server-side validation
- Client-side validation can be bypassed
- SQL injection risk (if backend added)
- XSS vulnerability in user inputs

**Recommendation**:
- Implement server-side validation
- Sanitize all user inputs
- Use Content Security Policy (CSP)
- Implement rate limiting

---

### 6. **No HTTPS Enforcement** 🟡 MEDIUM
**Issue**: No indication of HTTPS requirement

**Recommendation**:
- Enforce HTTPS for all connections
- Use HSTS headers
- Implement secure cookies (if using)

---

## 📋 Data Storage Inventory

### Current localStorage Keys:

1. **`aromatherapy_users`** - All user accounts (passwords, emails, membership)
2. **`aromatherapy_current_user`** - Currently logged-in user email
3. **`user_questionnaire_{userId}`** - User health questionnaire data
4. **`user_profiles_{userId}`** - User health profiles (up to 2 per user)
5. **`healthQuestionnaireData`** - Global questionnaire data (for non-logged users)
6. **`user_history_{userId}`** - User browsing history
7. **`user_scenario_history_{userId}`** - AI-generated scenario history
8. **`eo_recipes_v1`** - User-created recipes
9. **`eo_lists_v1`** - User inventory lists
10. **`savedFormulas`** - Formula builder data

### sessionStorage Keys:
1. **`viewScenarioSuggestion`** - Temporary scenario data
2. **`wechat_state`** - WeChat OAuth state

---

## ✅ IMMEDIATE ACTION ITEMS (Before Public Launch)

### Priority 1 - Critical (Do Before Launch):
1. ✅ **Remove API keys from frontend code**
2. ✅ **Implement backend server for API calls**
3. ✅ **Stop storing passwords in plain text**
4. ✅ **Move user authentication to backend**
5. ✅ **Implement HTTPS**

### Priority 2 - High (Do Soon):
6. ✅ **Encrypt sensitive health data**
7. ✅ **Add privacy policy and terms of service**
8. ✅ **Implement user consent mechanisms**
9. ✅ **Add data export/deletion features**
10. ✅ **Implement proper error handling**

### Priority 3 - Medium (Do After Launch):
11. ✅ **Add rate limiting**
12. ✅ **Implement monitoring and logging**
13. ✅ **Add backup and recovery**
14. ✅ **Regular security audits**

---

## 🛠️ Recommended Architecture Changes

### Current Architecture (Insecure):
```
Frontend (Browser)
  ├── localStorage (all user data)
  ├── Plain text passwords
  └── Exposed API keys
```

### Recommended Architecture (Secure):
```
Frontend (Browser)
  ├── Only UI and non-sensitive data
  └── API calls to backend
        │
Backend Server
  ├── User authentication (JWT tokens)
  ├── Password hashing (bcrypt)
  ├── Database (encrypted)
  ├── API key management
  └── Data validation
```

---

## 📝 Privacy & Compliance Considerations

### GDPR Requirements (if serving EU users):
- ✅ User consent for data collection
- ✅ Right to access data
- ✅ Right to delete data
- ✅ Data portability
- ✅ Privacy policy
- ✅ Data breach notification

### Health Data Regulations:
- Health information may be subject to additional regulations
- Consider HIPAA compliance if serving US users
- Implement proper data anonymization

---

## 🔧 Quick Fixes (Temporary - Before Backend Implementation)

### 1. Remove API Key from Frontend:
```javascript
// ai-service.js - REMOVE THIS:
apiKey: 'sk-5f6238c8a43741afa79a51dee16b6b27',

// REPLACE WITH:
apiKey: '', // Must be configured via backend
```

### 2. Add Warning in auth.js:
```javascript
// Add at top of auth.js
console.warn('⚠️ SECURITY WARNING: This is a demo version. Passwords are stored in plain text. DO NOT use real passwords.');
```

### 3. Add Privacy Notice:
Create a privacy notice page explaining:
- What data is collected
- How it's stored (localStorage)
- User rights
- Data security limitations

---

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [Web Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## ⚠️ DISCLAIMER

**This application is NOT ready for public use in its current state.** 

The security issues identified above pose significant risks to user privacy and data security. It is strongly recommended to implement the recommended fixes before making this application publicly available.


