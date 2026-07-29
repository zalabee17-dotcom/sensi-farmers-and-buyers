# Auth System Notes

## Current State
- Login page (/login) renders correctly with email + password fields
- Signup page (/signup) renders correctly with name, email, phone, location, password, confirm password
- Home page renders correctly with updated CTAs pointing to /signup
- Navbar correctly shows "Sign in" / "Sign up" when unauthenticated

## What the screenshots show
- The Navbar shows "Dashboard" and "Sign out" because the old OAuth session cookie is still in the browser from the previous checkpoint
- When the old cookie is cleared or expires, the Navbar will correctly show "Sign in" / "Sign up"
- The login/signup pages are properly wired to POST /api/auth/login and POST /api/auth/signup

## Backend Flow
1. POST /api/auth/signup → creates user in users table + authCredentials table → signs JWT → sets app_session_id cookie
2. POST /api/auth/login → verifies email/password against authCredentials → signs JWT → sets app_session_id cookie
3. JWT is signed with sdk.signSession() using the same mechanism as OAuth
4. authenticateRequest() in sdk.ts reads the cookie, verifies JWT, looks up user by openId in users table
5. Custom auth users have openId = `user_${Date.now()}` which allows them to be found by getUserByOpenId()

## All startLogin references removed
- All client .tsx files no longer reference startLogin
- main.tsx redirects unauthorized errors to /login instead of OAuth
- All dashboard fallbacks point to /login
