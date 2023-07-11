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
import { UserHandler } from "../auth/UserHandler";
import { AuthzProvider } from "../auth/AuthzProvider";
import { authzProvider } from "../auth/authorization";
import { systemProvider } from "./systems/systems";
import { SystemProvider } from "./systems/SystemProvider";
import { ReviewerHandler } from "./reviews/ReviewerHandler";

/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
export class DataAccessLayer {
  // Database Connection Pool for direct access to postgres
  pool: Pool;

  // DataServices - specific logic to handle database interactions
  modelService: ModelDataService;
  controlService: ControlDataService;
  threatService: ThreatDataService;
  mitigationService: MitigationDataService;
  notificationService: NotificationDataService;
  reviewService: ReviewDataService;
  suggestionService: SuggestionDataService;
  reportService: ReportDataService;
  bannerService: BannerDataService;

  // Non-Database related handlers
  sysPropHandler: SystemPropertyHandler;
  ccHandler: ComponentClassHandler;
  templateHandler: TemplateHandler;
  suggestionEngine: SuggestionEngine;
  userHandler: UserHandler;
  reviewerHandler: ReviewerHandler;

  get authzProvider(): AuthzProvider {
    return authzProvider;
  }

  get systemProvider(): SystemProvider {
    return systemProvider;
  }

  constructor(pool: Pool) {
    this.pool = pool;
    this.sysPropHandler = new SystemPropertyHandler();
    this.ccHandler = new ComponentClassHandler();
    this.templateHandler = new TemplateHandler();
    this.userHandler = new UserHandler();
    this.reviewerHandler = new ReviewerHandler();

    // Initialize Data Services
    this.modelService = new ModelDataService(pool, this);
    this.controlService = new ControlDataService(pool, this);
    this.threatService = new ThreatDataService(pool, this);
    this.mitigationService = new MitigationDataService(pool);
    this.notificationService = new NotificationDataService(pool, this);
    this.reviewService = new ReviewDataService(pool, this);
    this.suggestionService = new SuggestionDataService(pool, this);
    this.suggestionEngine = new SuggestionEngine(this);
    this.reportService = new ReportDataService(pool, this);
    this.bannerService = new BannerDataService(pool, this);
  }
}
