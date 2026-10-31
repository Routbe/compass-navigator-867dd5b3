## Wallet rules
- Wallet passes are issued only by `/api/wallet/$kind/$id` from public profile/event data (`wallet.server.ts`); content comes from pure `wallet-pass.ts`, and a wallet with incomplete certificates is off. Why: private profiles never become passes and missing keys never crash the share menu.
