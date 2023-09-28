import pg from "pg";
import { TemplateHandler } from "../notifications/TemplateHandler.js";
import { SuggestionEngine } from "../suggestions/engine.js";
import { ComponentClassHandler } from "./component-classes/index.js";
import { SystemPropertyHandler } from "./system-property/SystemPropertyHandler.js";
import { ControlDataService } from "./controls/ControlDataService.js";
import { MitigationDataService } from "./mitigations/MitigationDataService.js";
import { ModelDataService } from "./models/ModelDataService.js";
import { NotificationDataService } from "./notifications/NotificationDataService.js";
import { ReviewDataService } from "./reviews/ReviewDataService.js";
import { SuggestionDataService } from "./suggestions/SuggestionDataService.js";
import { ThreatDataService } from "./threats/ThreatDataService.js";
import { ReportDataService } from "./reports/ReportDataService.js";
import { BannerDataService } from "./banners/BannerDataService.js";
import { UserHandler } from "../auth/UserHandler.js";
import { TeamHandler } from "../auth/TeamHandler.js";
import { AuthzProvider } from "../auth/AuthzProvider.js";
import { authzProvider } from "../auth/authorization.js";
import { systemProvider } from "./systems/systems.js";
import { SystemProvider } from "./systems/SystemProvider.js";
import { ReviewerHandler } from "./reviews/ReviewerHandler.js";
import { createPostgresPool, getDatabaseName } from "./postgres.js";

/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
export class DataAccessLayer {
  // Database Connection Pool for direct access to postgres
  pool: pg.Pool;

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
  teamHandler: TeamHandler;

  get authzProvider(): AuthzProvider {
    return authzProvider;
  }

  get systemProvider(): SystemProvider {
    return systemProvider;
  }

  async pluginPool(pluginSuffix: string): Promise<pg.Pool> {
    const databaseName = await getDatabaseName(pluginSuffix);
    return createPostgresPool({ database: databaseName });
  }

  constructor(pool: pg.Pool) {
    this.pool = pool;
    this.sysPropHandler = new SystemPropertyHandler();
    this.ccHandler = new ComponentClassHandler();
    this.templateHandler = new TemplateHandler();
    this.teamHandler = new TeamHandler();
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
