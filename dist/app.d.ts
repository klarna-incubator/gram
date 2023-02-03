import { Pool } from "pg";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
declare function createApp(pool: Pool): Promise<{
    app: import("express-serve-static-core").Express;
    dal: DataAccessLayer;
}>;
export default createApp;
//# sourceMappingURL=app.d.ts.map