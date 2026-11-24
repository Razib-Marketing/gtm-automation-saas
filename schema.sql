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
    schedule_time TEXT DEFAULT '08:00',
    schedule_timezone TEXT DEFAULT 'UTC',
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

-- Projects Table (Organization -> Project isolation)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    website_url TEXT,
    website_type TEXT DEFAULT 'general',
    gtm_account_id TEXT,
    gtm_account_name TEXT,
    gtm_container_id TEXT,
    gtm_container_name TEXT,
    gtm_container_public_id TEXT,
    gtm_workspace_id TEXT,
    gtm_workspace_name TEXT,
    ga4_property_id TEXT,
    ga4_property_name TEXT,
    measurement_id TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT,
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
    project_id TEXT,
    property_id TEXT NOT NULL,
    property_name TEXT,
    metric TEXT NOT NULL,
    threshold_percentage REAL NOT NULL,
    comparison_period TEXT DEFAULT 'daily',
    alert_email TEXT NOT NULL,
    condition_type TEXT,
    conditions TEXT,
    match_type TEXT DEFAULT 'ANY',
    schedule_time TEXT DEFAULT '08:00',
    schedule_timezone TEXT DEFAULT 'UTC',
    schedule_frequency TEXT DEFAULT 'daily',
    last_run_local_date TEXT,
    website_type TEXT DEFAULT 'general',
    status TEXT DEFAULT 'active',
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GA4 Alerts Table
CREATE TABLE IF NOT EXISTS ga4_alerts (
    id TEXT PRIMARY KEY,
    monitor_id TEXT NOT NULL REFERENCES ga4_monitors(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    project_id TEXT,
    property_name TEXT,
    metric TEXT NOT NULL,
    condition_type TEXT,
    percent_change REAL,
    alert_type TEXT DEFAULT 'automated',
    status TEXT DEFAULT 'anomaly',
    recipients TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GA4 Account & Property Audit Logs Table
CREATE TABLE IF NOT EXISTS ga4_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    property_id TEXT NOT NULL,
    property_name TEXT,
    health_score INTEGER NOT NULL,
    critical_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    passed_count INTEGER DEFAULT 0,
    raw_data TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
