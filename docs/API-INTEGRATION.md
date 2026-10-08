# External API Integration Guide

## Overview

The Vortex Cubes CRM is designed with a provider-agnostic architecture. For local development and testing, "mock" providers are used by default.

To enable real-world functionality, you must configure the environment variables for your selected providers and update the provider selection variables.

## 1. Provider Selection

In your `.env` file, you can explicitly choose which provider handles which responsibility.

```env
AI_PROVIDER="openai"         # Options: mock, openai
WHATSAPP_PROVIDER="meta"       # Options: mock, meta
EMAIL_PROVIDER="resend"      # Options: mock, resend
DISCOVERY_PROVIDER="mock"    # Options: mock
```

## 2. Setting Up OpenAI

1. Go to [OpenAI Platform](https://platform.openai.com/).
2. Generate an API Key.
3. Add it to your `.env` (or Vercel environment variables).

```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o"
```

## 3. Setting Up Meta (WhatsApp Cloud API)

1. Create a [Meta Developer Account](https://developers.facebook.com/).
2. Create an App and add WhatsApp product.
3. Configure your phone number and verify your business.
4. Configure the Webhook in the Meta App Dashboard to point to your production URL:
   `https://your-domain.com/api/webhooks/meta/whatsapp`
5. Use your Verification Token and App Secret for webhook validation.
6. Add the variables to your `.env`.

```env
META_WA_ACCESS_TOKEN="EA..."
META_WA_PHONE_NUMBER_ID="..."
META_WA_BUSINESS_ACCOUNT_ID="..."
META_WA_VERIFY_TOKEN="your_verify_token"
META_WA_APP_SECRET="your_app_secret"
```

## 4. Setting Up Resend (Email)

1. Create a [Resend Account](https://resend.com/).
2. Verify your sending domain.
3. Generate an API Key.
4. Configure Resend webhooks (if you want delivery/bounce tracking) to point to:
   `https://your-domain.com/api/webhooks/resend`
   (Listen for events: `email.delivered`, `email.bounced`, `email.complained`).
5. Add variables to your `.env`.

```env
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="hello@yourdomain.com"
```

> **Note on Inbound Email:** Resend currently focuses heavily on outbound. If you need to process inbound email replies for Reply Intelligence, you may need to configure a webhook forwarder (like SendGrid Inbound Parse or Postmark) and create a specific webhook handler in `/api/webhooks/email`.

## 5. Lead Discovery

Lead discovery is currently using a `MockScrapingProvider`. To implement real discovery:
1. Choose an API (e.g., Apollo, Clearbit, Hunter.io, or BrightData).
2. Implement the `IScrapingProvider` and `IEnrichmentProvider` interfaces.
3. Update `ProviderFactory.ts` to return your new provider.

## Common Errors

- **Missing Environment Variables**: The application will not crash on boot, but the specific feature will throw an error and fail the background job if the provider requires a key that is missing.
- **Webhook Not Reaching System**: Ensure your Next.js application is publicly accessible (use ngrok for local development).
- **Meta Duplicate Messages**: Meta will retry webhook deliveries if your system does not respond successfully in time. The CRM uses `IdempotencyService` and checks `externalMessageId` to prevent duplicate processing. Ensure your background workers (`/api/jobs/process`) are running frequently.
