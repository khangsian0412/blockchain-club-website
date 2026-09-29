# Blockchain Club Platform

## Increment 3 — On-chain membership verification

Run the interface:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To activate sign-up, create a Privy app, enable **Email** and **Google** in its dashboard, then copy `.env.example` to `.env.local` and add its public app ID. Restart `npm run dev` after editing the environment file.

The sign-in button opens Privy's email/Google login flow. On first login, Privy creates an embedded EVM wallet automatically. The app deliberately reports membership verification as pending until the club contract is deployed.

The ERC-5192 contract is at `contracts/src/ClubMembership.sol`. Its `^0.8.20` pragma is compiled with Solidity 0.8.24 to support the current OpenZeppelin v5 release. To compile it after installing Foundry:

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-git
forge build
```

Set `NEXT_PUBLIC_MEMBERSHIP_CONTRACT` to the deployed `ClubMembership` address and `NEXT_PUBLIC_RPC_URL` to an HTTPS RPC endpoint for that same chain. After restarting the dev server, a signed-in student is checked by calling `balanceOf(embeddedWalletAddress)` directly against the contract. The interface reports either **Verified club member** or **No membership token found**.

The owner of the contract must mint a membership token to the student's displayed wallet address for it to become verified. Verified members can access the member library and publish event links.

## Shared events database

The event board uses a Cloudflare Worker and D1 database. Public visitors can read event links; publishing requires a signature from a wallet that holds the Sepolia membership token. The Worker stores only the event link, title, and timestamp—not the member's wallet address.

From the `worker` directory, install the Worker dependencies and sign in to Cloudflare:

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create nus-blockchain-club-events
```

The Worker configuration contains the D1 binding. After creating your own database, replace its binding and ID in `worker/wrangler.toml`. Then create the database table and deploy the API:

```bash
npx wrangler d1 migrations apply nus-blockchain-club-events --remote
npx wrangler deploy
```

In the deployed Worker's **Settings → Variables and Secrets**, add these plain-text variables:

```text
MEMBERSHIP_CONTRACT=0x321D7592f728f77ebbDCf5B504D0F36Ac5caa6c8
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ALLOWED_ORIGIN=http://localhost:3000
```

For local Worker development, copy `.dev.vars.example` to `.dev.vars`. After deployment, set this in the root `.env.local` and restart the Next.js dev server:

```text
NEXT_PUBLIC_EVENTS_API_URL=https://nus-blockchain-club-events.<your-subdomain>.workers.dev
```

Before deploying the website to Fleek, change `ALLOWED_ORIGIN` to the final site URL (without a trailing slash), redeploy the Worker, then run the static deployment build.

## Static deployment

The Next.js app is configured with `output: 'export'`. Run `npm run build`, then upload the generated `out/` directory to Fleek/IPFS.
