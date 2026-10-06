# Google Ads & Facebook Event Tags Implementation Plan

This plan introduces full support for Meta (Facebook) Pixel tracking and Google Ads Conversion Tracking into the automation platform. It allows users to set global pixel/conversion IDs and selectively deploy FB/Ads event tags alongside their GA4 tags.

## Proposed Changes

### UI & Configuration (`src/pages/Dashboard.tsx`)
- [MODIFY] Add Global Settings block for `Facebook Pixel ID` and `Google Ads ID (AW-XXXXXXX)` near the GA4 Measurement ID input.
- [MODIFY] In the `moduleConfigs` state map, add properties: `enableFb: boolean`, `enableAds: boolean`, and `adsLabel: string`.
- [MODIFY] Render checkboxes for "Deploy FB Event" and "Deploy Ads Event" on each selected module card.
- [MODIFY] Render a text input for "Conversion Label" if the Ads Event checkbox is checked.
- [MODIFY] Pass these global IDs and per-module configs into the `/api/gtm/generate` payload.

### Backend Generator (`functions/api/gtm/generate.ts`)
- [MODIFY] Accept `fbPixelId` and `googleAdsId` from the payload.
- [MODIFY] Create a special `base_config` template block if either ID is provided. This block will inject:
  - **Conversion Linker Tag** (type `gclaw`) firing on All Pages.
  - **Facebook Base Pixel Tag** (type `html`) firing on All Pages.
- [MODIFY] Update `getModulePayloads()` to accept the module's `fb` and `ads` config.
  - If `enableFb` is true, inject a Custom HTML tag calling `fbq('trackCustom', eventName)`. (For known form submissions, map `eventName` to `fbq('track', 'Lead')`).
  - If `enableAds` is true, inject a Google Ads Conversion tag (type `awct`) passing the `adsId` and `adsLabel`.
  - Ensure these new tags share the exact same trigger as the primary GA4 event tag.

## Verification Plan
- Deploy changes to a Cloudflare Pages preview URL.
- Perform a test deployment to a dummy GTM container.
- Use GTM Preview Mode to verify the Conversion Linker, Base FB Pixel, `fbq` custom HTML tags, and `awct` Google Ads tags are correctly created and attached to their triggers.
