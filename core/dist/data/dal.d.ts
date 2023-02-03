import { Pool } from "pg";
import { TemplateHandler } from "../notifications/TemplateHandler";
import { SuggestionEngine } from "../suggestions/engine";
import { ComponentClassHandler } from "./component-classes";
import { SystemPropertyHandler } from "./system-property/SystemPropertyHandler";
import { ControlDataService } from "./controls/ControlDataService";
import { MitigationDataService } from "./mitigations/MitigationDataService";
import { ModelDataService } from "./models/ModelDataService";
import { NotificationDataService } from "./notifications/NotificationDataService";
import { ReviewDataService } from "./reviews/ReviewDataService";
import { SuggestionDataService } from "./suggestions/SuggestionDataService";
import { ThreatDataService } from "./threats/ThreatDataService";
import { ReportDataService } from "./reports/ReportDataService";
import { BannerDataService } from "./banners/BannerDataService";
/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
export declare class DataAccessLayer {
    pool: Pool;
    modelService: ModelDataService;
    controlService: ControlDataService;
    threatService: ThreatDataService;
    mitigationService: MitigationDataService;
    notificationService: NotificationDataService;
    reviewService: ReviewDataService;
    suggestionService: SuggestionDataService;
    sysPropHandler: SystemPropertyHandler;
    ccHandler: ComponentClassHandler;
    templateHandler: TemplateHandler;
    suggestionEngine: SuggestionEngine;
    reportService: ReportDataService;
    bannerService: BannerDataService;
    constructor(pool: Pool);
}
//# sourceMappingURL=dal.d.ts.map