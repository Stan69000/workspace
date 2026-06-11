// src/lib/auth-client.ts
// Client Better Auth pour le navigateur (login, 2FA, session).

import { createAuthClient } from 'better-auth/react'
import { twoFactorClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  // baseURL omis → déduit de window.location (même origine). En SSR, Better Auth
  // utilise BETTER_AUTH_URL. On garde le défaut pour éviter les incohérences d'origine.
  plugins: [
    twoFactorClient({
      // Quand un compte 2FA tente de se connecter, on l'envoie vers la page de
      // vérification du code TOTP / code de secours.
      onTwoFactorRedirect() {
        window.location.href = '/login/two-factor'
      },
    }),
  ],
})

export const { signIn, signOut, useSession, twoFactor } = authClient
