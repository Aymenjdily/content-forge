# Deployment Strategy

## Services & Costs (Estimated Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Pro (for serverless functions) | $20 |
| Trigger.dev | Free / Starter | $0-25 |
| Supabase / Neon | Free tier | $0 |
| Clerk | Free tier (10k MAU) | $0 |
| OpenAI | Pay-as-you-go | ~$10-30 |
| Replicate | Pay-as-you-go | ~$5-15 |
| Resend | Free tier (3k emails/mo) | $0 |
| **Total** | | **~$35-90/mo** |

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://...?sslmode=verify-full"

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/register"

# Trigger.dev
TRIGGER_SECRET_KEY="tr_..."

# AI APIs
OPENAI_API_KEY="sk-..."
REPLICATE_API_TOKEN="r8_..."

# Email
RESEND_API_KEY="re_..."

# Social (optional for MVP)
LINKEDIN_CLIENT_ID="..."
LINKEDIN_CLIENT_SECRET="..."
TWITTER_API_KEY="..."
TWITTER_API_SECRET="..."
```
