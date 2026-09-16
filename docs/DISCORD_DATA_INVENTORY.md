# Discord & Email State Data Inventory

For privacy policy use. Not shipped in the application bundle.
Last updated: 2026-09-16.

---

## Fields stored from Discord OAuth (Account table, provider = "discord")

| Field                   | Source                        | Purpose                                                   | Retention                                      |
|-------------------------|-------------------------------|-----------------------------------------------------------|------------------------------------------------|
| `providerAccountId`     | Discord user ID               | Stable identifier linking the Leet9 account to Discord   | Deleted when user deletes their account        |
| `access_token`          | OAuth token exchange          | Used to call Discord API on behalf of the user            | Deleted when user deletes; revoked at Discord  |
| `refresh_token`         | OAuth token exchange          | Obtain a new access token without re-authorisation        | Null in current flow (not stored); same policy |
| `token_type`            | OAuth token exchange          | Identifies the token scheme (always "Bearer")             | Deleted when user deletes their account        |
| `scope`                 | OAuth authorisation           | Records the permissions granted ("identify email")        | Deleted when user deletes their account        |
| `expires_at`            | OAuth token exchange          | Expiry timestamp of the access token                      | Deleted when user deletes their account        |
| `discordVerified`       | Discord profile (`verified`)  | Records whether Discord considers the address verified    | Deleted when user deletes their account        |

## Fields stored from Discord profile (User table, written at sign-in)

| Field       | Source                             | Purpose                                                             | Retention                               |
|-------------|------------------------------------|---------------------------------------------------------------------|-----------------------------------------|
| `name`      | `profile.global_name ?? username`  | Display name shown across Leet9                                     | Deleted when user deletes their account |
| `email`     | `profile.email` (if granted)       | Used for account recovery and Leet9 confirmation flow               | Deleted when user deletes their account |
| `image`     | Discord avatar CDN URL             | Profile picture shown across Leet9                                  | Deleted when user deletes their account |

Note: `emailVerified` is intentionally NOT set from Discord's `verified` flag.
Discord `verified` means Discord's own verification, not Leet9's confirmation.

## Fields stored from Discord profile (PlatformAccount table, provider = "discord")

| Field           | Source                             | Purpose                                                          | Retention                               |
|-----------------|------------------------------------|------------------------------------------------------------------|-----------------------------------------|
| `externalUserId`| Discord user ID                    | Stable identifier for Leet9 Connect gaming-identity link         | Deleted when user deletes their account |
| `username`      | `profile.global_name ?? username`  | Display name for the gaming identity                             | Deleted when user deletes their account |
| `displayName`   | Same as username                   | Display name shown in Leet9 Connect contexts                     | Deleted when user deletes their account |
| `status`        | Internal                           | Connection state (connected / disconnected)                      | Deleted when user deletes their account |
| `connectedAt`   | Timestamp set by Leet9             | Records when the Discord gaming identity was connected           | Deleted when user deletes their account |
| `metadata`      | Internal                           | Records how the connection was made (sign-in vs account_link)    | Deleted when user deletes their account |

---

## Fields added by Stories 5 & 6 (User table)

| Field                    | Purpose                                                                                       | Retention                                                         |
|--------------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `leet9Confirmed`         | Boolean: whether Leet9 has verified that the user controls the address in `User.email`        | Deleted when user deletes their account                           |
| `pendingEmail`           | An email address the user has submitted but not yet confirmed; never written to `User.email`  | Deleted when user deletes their account                           |
| `leet9ConfirmSentCount`  | Counter capping automatic confirmation email sends at 3 per address                           | Deleted when user deletes their account                           |

## Confirmation tokens (VerificationToken table)

| Identifier pattern        | Purpose                                                             | Retention                                                                                   |
|---------------------------|---------------------------------------------------------------------|---------------------------------------------------------------------------------------------|
| `leet9-confirm:<email>`   | Short-lived (24 h) token sent in the confirmation email link        | Expires automatically after 24 hours; explicitly deleted on account deletion                |

---

## Summary of deletion behaviour

When a user deletes their account (`DELETE /api/me`):

1. The full deletion transaction runs first (all rows above are removed).
2. After the transaction commits, the Discord `access_token` is revoked at
   `https://discord.com/api/oauth2/token/revoke`. Revocation failure is logged
   but never surfaces to the user — the token expires naturally within 7 days.
3. Any outstanding `leet9-confirm:<email>` and `leet9-confirm:<pendingEmail>`
   VerificationToken rows are deleted inside the transaction (no FK enforces this).
4. `pendingEmail` and `leet9ConfirmSentCount` are columns on `User` and are
   removed with the `User` row automatically.
