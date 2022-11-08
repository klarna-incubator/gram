# Authorization

Authorization for a user is split up into Role, Permission and ownership.

(Might be outdated)

## Roles

Roles are assigned during login. A user can have multiple roles. The roles are saved into the user's JWT.

To check role on a route-basis:

```ts
app.get(
  "/api/v1/models/:modelId/threats",
  auth,
  authz.is(Role.Admin), // this is the important part.
  cache,
  errorWrap(threats.list)
);
```

To check role inside a route function:

```ts
function getAllTheSecrets(req: Request) {
  req.authz.is(Role.Admin); // asserts that the user has the admin role.
}
```

## Permissions

Permissions are: _read_, _write_, _delete_, and _review_. These detail the users permission upon a specific object, i.e. the threat model or the system.
Each model-related route will likely fetch these permissions based on the model id.
A typical check might look something like this:

```ts
function updateTheModel(req: Request) {
  // ...
  await req.authz.hasPermissionsForModelId(modelId, Permission.Write);
}
```

The permissions are assigned depending on a variety of factors:

- If admin, then get all permissions regardless.
- If in the team that owns the system-id of the model => read/write permissions.
- If not in the team that owns the system-id => only read
- If the model does not have a system-id, then write access will only be given to the owning user.
