-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'custom'
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    account_deployment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GTM Connections Table (OAuth Tokens & Container Links)
CREATE TABLE IF NOT EXISTS gtm_connections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL, -- GTM Account ID
    container_id TEXT NOT NULL, -- GTM Container ID
    workspace_id TEXT, -- Current active workspace ID
    encrypted_refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deployed Recipes Table
CREATE TABLE IF NOT EXISTS deployed_recipes (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL REFERENCES gtm_connections(id) ON DELETE CASCADE,
    module_type TEXT NOT NULL, -- e.g., 'social_media', 'form_tracking', 'hospitality'
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
    deployment_log TEXT, -- JSON log of created tags/triggers/variables
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gtm_id TEXT NOT NULL,
    health_score INTEGER NOT NULL,
    issue_count INTEGER NOT NULL,
    raw_data TEXT NOT NULL, -- JSON string of the audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GA4 Monitors Table
CREATE TABLE IF NOT EXISTS ga4_monitors (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    property_name TEXT,
    metric TEXT NOT NULL,
    threshold_percentage REAL NOT NULL,
    comparison_period TEXT DEFAULT 'daily',
    alert_email TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
