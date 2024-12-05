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
import {
  GramConnectionPool,
  createPostgresPool,
  getDatabaseName,
} from "./postgres.js";
import { ActionItemHandler } from "../action-items/ActionItemHandler.js";
import { LinkDataService } from "./links/LinkDataService.js";
import { SearchHandler } from "../search/SearchHandler.js";
import { FlowDataService } from "./flow/FlowDataService.js";

import { ValidationEngine } from "../validation/engine.js";
import { ResourceHandler } from "../resources/ResourceHandler.js";

/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
export class DataAccessLayer {
  // Database Connection Pool for direct access to postgres
  pool: GramConnectionPool;

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
  linkService: LinkDataService;
  flowService: FlowDataService;

  // Non-Database related handlers
  sysPropHandler: SystemPropertyHandler;
  ccHandler: ComponentClassHandler;
  templateHandler: TemplateHandler;
  suggestionEngine: SuggestionEngine;
  userHandler: UserHandler;
  reviewerHandler: ReviewerHandler;
  teamHandler: TeamHandler;
  actionItemHandler: ActionItemHandler;
  searchHandler: SearchHandler;
  resourceHandler: ResourceHandler;
  validationEngine: ValidationEngine;

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
    this.pool = new GramConnectionPool(pool);
    this.sysPropHandler = new SystemPropertyHandler();
    this.ccHandler = new ComponentClassHandler();
    this.templateHandler = new TemplateHandler();
    this.teamHandler = new TeamHandler();
    this.userHandler = new UserHandler();
    this.reviewerHandler = new ReviewerHandler();
    this.searchHandler = new SearchHandler();
    this.resourceHandler = new ResourceHandler();

    // Initialize Data Services
    this.modelService = new ModelDataService(this);
    this.controlService = new ControlDataService(this);
    this.threatService = new ThreatDataService(this);
    this.mitigationService = new MitigationDataService(this);
    this.notificationService = new NotificationDataService(this);
    this.reviewService = new ReviewDataService(this);
    this.suggestionService = new SuggestionDataService(this);
    this.reportService = new ReportDataService(this);
    this.bannerService = new BannerDataService(this);
    this.linkService = new LinkDataService(this);
    this.flowService = new FlowDataService(this);

    // Initialize Engines
    this.validationEngine = new ValidationEngine(
      this,
      process.env.NODE_ENV === "test"
    );
    this.suggestionEngine = new SuggestionEngine(
      this,
      process.env.NODE_ENV === "test"
    );

    // Initialize Action Item Handler. Needs to happen after Data Services are initialized.
    this.actionItemHandler = new ActionItemHandler(this);
  }
}
