# OIDC Plugin

OIDC provider for authentication and authorization via OIDC-compatible providers (such as Okta, Azure AD, etc.).

## Features

- **Authentication**: OIDC-based identity provider for SSO login
- **Authorization**: Group-based authorization providers for roles, teams, and reviewers  
- **User Storage**: Database-backed user information storage from authentication for long-term reference and usage

## Installation

Add the @gram/oidc package to your config.

```sh
npm -w config i @gram/oidc
```

## Database Migration

The OIDC plugin requires database tables for storing user information and group mappings. Include the OIDC migrations in your configuration:

```ts
import { OIDCMigrations } from "@gram/oidc";

export const defaultConfig: GramConfiguration = {
  // ...
  additionalMigrations: [OIDCMigrations],
  // ...
};
```

## Configuration

### Basic Authentication Only

For basic OIDC authentication without authorization providers:

```ts
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { OIDCIdentityProvider } from "@gram/oidc";

// ...
bootstrapProviders: async function (dal: DataAccessLayer) {
    const oidc = new OIDCIdentityProvider(
        dal, // DataAccessLayer instance - required first parameter
        "https://<your-oidc-provider>/.well-known/openid-configuration",
        new EnvSecret("OIDC_CLIENT_ID"),
        new EnvSecret("OIDC_CLIENT_SECRET"),
        new EnvSecret("OIDC_SESSION_SECRET"),
        "email", // field to use for identity sub
        "oidc", // provider key
        true, // capture group claims
        "groups" // name of groups claim
    );

    return {
        // ...
        identityProviders: [oidc],
    }
}
```

### Full OIDC with Authorization Providers

For complete OIDC authentication and authorization:

```ts
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { Role } from "@gram/core/dist/auth/models/Role.js";
import {
    OIDCIdentityProvider,
    OIDCGroupBasedAuthzProvider,
    OIDCUserProvider,
    OIDCTeamProvider,
    OIDCGroupBasedReviewerProvider
} from "@gram/oidc";

// ...
bootstrapProviders: async function (dal: DataAccessLayer) {
    // Authentication provider
    const oidc = new OIDCIdentityProvider(
        dal, // DataAccessLayer instance - required first parameter
        "https://<your-oidc-provider>/.well-known/openid-configuration",
        new EnvSecret("OIDC_CLIENT_ID"),
        new EnvSecret("OIDC_CLIENT_SECRET"),
        new EnvSecret("OIDC_SESSION_SECRET"),
        "email", // field to use for identity sub
        "oidc", // provider key
        true, // capture group claims
        "groups" // name of groups claim
    );

    // Authorization provider - maps groups to roles
    const groupToRoleMap = new Map([
        ["gram-admins", Role.Admin],
        ["gram-reviewers", Role.Reviewer],
        ["gram-users", Role.User],
    ]);

    const authzProvider = new OIDCGroupBasedAuthzProvider(dal, {
        groupsClaimName: "groups",
        groupToRoleMap,
    });

    // User provider
    const userProvider = new OIDCUserProvider(dal, {
        userInfoToUser: (userInfo) => ({
            sub: userInfo.email,
            name: userInfo.name,
            mail: userInfo.email,
            slackUrl: userInfo.slack_url,
        }),
    });

    // Team provider
    const teamProvider = new OIDCTeamProvider(dal, {
        groupsClaimName: "groups",
        // Optional: filter to only include specific groups as teams
        groupFilter: ["team-frontend", "team-backend", "team-security"],
        groupToTeam: (groupName) => ({
            id: groupName,
            name: groupName.replace(/-/g, " "),
            email: `${groupName}@company.com`,
        }),
    });

    // Reviewer provider
    const reviewerProvider = new OIDCGroupBasedReviewerProvider(dal, {
        groupsClaimName: "groups",
        reviewerGroups: ["gram-reviewers", "gram-security"],
        userInfoToReviewer: (userInfo) => ({
            sub: userInfo.email,
            name: userInfo.name,
            mail: userInfo.email,
            recommended: userInfo.groups?.includes("gram-security") || false,
            slackUrl: userInfo.slack_url,
        }),
        fallbackReviewer: {
            sub: "security-team@company.com",
            name: "Security Team",
            mail: "security-team@company.com",
            recommended: true,
        },
    });

    return {
        // ...
        identityProviders: [oidc],
        authzProvider: authzProvider,
        userProvider: userProvider,
        teamProvider: teamProvider,
        reviewerProvider: reviewerProvider,
    }
}
```

### Okta-Specific Configuration

For Okta, you'll typically want to:

1. Set up group claims in your Okta application
2. Configure the groups claim name (usually "groups")
3. Map Okta groups to Gram roles

```ts
// Okta example
const oidc = new OIDCIdentityProvider(
    dal, // Required DataAccessLayer parameter
    "https://your-org.okta.com/.well-known/openid-configuration",
    new EnvSecret("OKTA_CLIENT_ID"),
    new EnvSecret("OKTA_CLIENT_SECRET"),
    new EnvSecret("OIDC_SESSION_SECRET"),
    "email",
    "okta",
    true,
    "groups" // Okta groups claim
);

// Map your Okta groups to Gram roles
const groupToRoleMap = new Map([
    ["Everyone", Role.User], // Default Okta group
    ["Gram Reviewers", Role.Reviewer],
    ["Gram Admins", Role.Admin],
]);
```

## OIDC Provider Setup

### At your OIDC provider

Gram uses the `/login/callback/oidc` (or `/login/callback/{key}` if you use a custom key) for the Sign-in redirect URIs. You'll need to configure this at your OIDC provider.

Set allowed redirect_url to:
- Production: `https://<your-gram-domain>/login/callback/oidc`
- Development: `http://localhost:4726/login/callback/oidc`

### Required Claims

For full functionality, ensure your OIDC provider includes these claims:

- `sub` or `email` - User identifier
- `name` - User's display name
- `email` - User's email address
- `groups` - User's group memberships (array of strings)

### Team Group Filtering

The `OIDCTeamProvider` supports filtering which groups are treated as teams using the `groupFilter` option:

```ts
const teamProvider = new OIDCTeamProvider(dal, {
    groupsClaimName: "groups",
    groupFilter: [
        "team-frontend",     // Only these groups become teams
        "team-backend", 
        "team-security"
    ],
    groupToTeam: (groupName) => ({
        id: groupName,
        name: groupName.replace(/^team-/, "").replace(/-/g, " "),
        email: `${groupName}@company.com`,
    }),
});
```

- **With groupFilter**: Only groups in the filter list are converted to teams
- **Without groupFilter**: All user groups are converted to teams  
- **Empty groupFilter**: Behaves the same as not providing the option

This is useful when you have groups for authorization (like "Reviewers", "Admins") that shouldn't be teams, and separate groups for actual teams (like "Frontend Team", "Backend Team").

## Environment Variables

```bash
# Required
OIDC_CLIENT_ID=your_client_id
OIDC_CLIENT_SECRET=your_client_secret
OIDC_SESSION_SECRET=base64_encoded_session_secret
```

## Database Management

The OIDC plugin creates two database tables:

- **oidc_users**: Stores user information (sub, email, name, timestamps)
- **oidc_user_groups**: Stores normalized user-group relationships for efficient querying

### Available Methods

The `OIDCUserStore` provides these methods for managing user data:

```ts
import { OIDCUserStore } from "@gram/oidc";

const userStore = OIDCUserStore.getInstance(dal);

// Store/update user information
await userStore.storeUser({
    sub: "user123",
    email: "user@example.com", 
    name: "John Doe",
    groups: ["team-frontend", "reviewers"]
});

// Retrieve user information by sub or email
const userInfo = await userStore.getUser("user123");

// Get groups for a user
const groups = await userStore.getGroupsForUser("user123");

// Get all users in a group
const users = await userStore.getUsersInGroup("reviewers");

// Get all unique group names
const allGroups = await userStore.getAllUniqueGroups();

// Remove user and all their group memberships
await userStore.removeUser("user123");

// Clean up old users (optional maintenance)
await userStore.cleanupOldUsers(90); // older than 90 days
```

## Security Considerations

1. **User Storage**: User information and group memberships are stored in the database for long-term reference and usage
2. **No Token Storage**: Access tokens are not stored in the database for security  
3. **Session Security**: Session data is encrypted using AES-256-GCM
4. **Database Claims**: Authorization providers use stored user data from the database, no additional API calls to OIDC provider

## Troubleshooting

### Groups Not Available

If group claims aren't working:

1. Verify groups are included in the ID token or available via userinfo endpoint
2. Check the groups claim name matches your configuration
3. Ensure your OIDC client has permissions to read group information

### Database User Issues

If authorization seems stale:

1. User information is stored in the database - users may need to re-login for immediate updates after group changes
2. Check logs for database query success/failures
3. Authorization providers use stored user data from the database, so group changes require re-authentication to update stored data
