import { onRequest as __api_auth_google_callback_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/auth/google/callback.ts"
import { onRequest as __api_auth_google_login_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/auth/google/login.ts"
import { onRequest as __api_gtm_accounts_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/gtm/accounts.ts"
import { onRequest as __api_gtm_audit_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/gtm/audit.ts"
import { onRequest as __api_gtm_containers_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/gtm/containers.ts"
import { onRequest as __api_gtm_deploy_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/gtm/deploy.ts"
import { onRequest as __api_gtm_workspaces_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/gtm/workspaces.ts"
import { onRequest as __api_contact_ts_onRequest } from "/Users/mdatiarrahmanovi/GTM and Analytics Automation SaaS/functions/api/contact.ts"

export const routes = [
    {
      routePath: "/api/auth/google/callback",
      mountPath: "/api/auth/google",
      method: "",
      middlewares: [],
      modules: [__api_auth_google_callback_ts_onRequest],
    },
  {
      routePath: "/api/auth/google/login",
      mountPath: "/api/auth/google",
      method: "",
      middlewares: [],
      modules: [__api_auth_google_login_ts_onRequest],
    },
  {
      routePath: "/api/gtm/accounts",
      mountPath: "/api/gtm",
      method: "",
      middlewares: [],
      modules: [__api_gtm_accounts_ts_onRequest],
    },
  {
      routePath: "/api/gtm/audit",
      mountPath: "/api/gtm",
      method: "",
      middlewares: [],
      modules: [__api_gtm_audit_ts_onRequest],
    },
  {
      routePath: "/api/gtm/containers",
      mountPath: "/api/gtm",
      method: "",
      middlewares: [],
      modules: [__api_gtm_containers_ts_onRequest],
    },
  {
      routePath: "/api/gtm/deploy",
      mountPath: "/api/gtm",
      method: "",
      middlewares: [],
      modules: [__api_gtm_deploy_ts_onRequest],
    },
  {
      routePath: "/api/gtm/workspaces",
      mountPath: "/api/gtm",
      method: "",
      middlewares: [],
      modules: [__api_gtm_workspaces_ts_onRequest],
    },
  {
      routePath: "/api/contact",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_contact_ts_onRequest],
    },
  ]