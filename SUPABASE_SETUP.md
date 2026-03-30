# Supabase Authentication Setup for Google Login

## 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in.
2. Create a new project (or use existing).
3. Note your project URL and anon public key from **Settings > API**.

## 2. Configure Google OAuth Provider
1. In Supabase dashboard, go to **Authentication > Providers**.
2. Enable **Google** provider.
3. You'll need a Google OAuth 2.0 Client ID and secret:
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Create a new OAuth 2.0 Client ID for a Web application.
   - Add authorized redirect URI: `https://<your-project-id>.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret, paste them into Supabase Google provider settings.
4. Save.

## 3. Environment Variables
In the frontend directory (`bidvibe-ui`), create or edit `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8080  # Spring Boot backend
```

Replace with your actual Supabase credentials.

## 4. Backend JWT Verification (Optional but Recommended)
Currently the Spring Boot `JwtAuthFilter` only decodes the JWT without verifying the signature. This is fine for development, but in production you should verify the token using Supabase's JWKS endpoint.

To add verification, update `JwtAuthFilter` to call Supabase's JWKS endpoint (`https://<project-id>.supabase.co/auth/v1/jwks`) and verify the token signature. You can use libraries like `com.auth0:java-jwt` or `io.jsonwebtoken:jjwt-api`.

If you keep the current implementation, ensure that your Supabase JWT secret is kept secure and that the backend only accepts tokens from your Supabase project.

## 5. Run the Application
1. Start the Spring Boot backend (default port 8080).
2. In the `bidvibe-ui` folder, run:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` (or the Vite dev server port).
4. Click "Sign in with Google" and complete the OAuth flow.

## 6. Troubleshooting
- **401 Unauthorized**: Check that the Supabase token is being attached to requests (look in browser DevTools Network tab). Ensure the backend JWT filter can parse the token correctly.
- **Redirect loop**: Make sure the redirect URI in Supabase matches the one used in the frontend (`window.location.origin/auth/callback`).
- **Missing user profile**: The backend `UserService.findOrCreate` should create a user record on first login. Verify that the `users` table exists in Supabase and that the `sub` (UUID) from the JWT is stored.

## 7. Next Steps
- Add more OAuth providers (Facebook, GitHub) if needed.
- Implement email/password login as a fallback.
- Customize the login page UI.