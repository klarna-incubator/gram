import physical from "express-physical";

export function selfCheck(done: any) {
  done(
    physical.response({
      name: "@gram/api-self",
      actionable: true,
      healthy: true,
      type: physical.type.SELF,
    })
  );
}
