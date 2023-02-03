"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataAccessLayer = void 0;
const TemplateHandler_1 = require("../notifications/TemplateHandler");
const engine_1 = require("../suggestions/engine");
const component_classes_1 = require("./component-classes");
const SystemPropertyHandler_1 = require("./system-property/SystemPropertyHandler");
const ControlDataService_1 = require("./controls/ControlDataService");
const MitigationDataService_1 = require("./mitigations/MitigationDataService");
const ModelDataService_1 = require("./models/ModelDataService");
const NotificationDataService_1 = require("./notifications/NotificationDataService");
const ReviewDataService_1 = require("./reviews/ReviewDataService");
const SuggestionDataService_1 = require("./suggestions/SuggestionDataService");
const ThreatDataService_1 = require("./threats/ThreatDataService");
const ReportDataService_1 = require("./reports/ReportDataService");
const BannerDataService_1 = require("./banners/BannerDataService");
/**
 * Class that carries access to all DataServices, useful for passing dependencies.
 */
class DataAccessLayer {
    constructor(pool) {
        this.pool = pool;
        this.sysPropHandler = new SystemPropertyHandler_1.SystemPropertyHandler();
        this.ccHandler = new component_classes_1.ComponentClassHandler();
        this.templateHandler = new TemplateHandler_1.TemplateHandler();
        // Initialize Data Services
        this.modelService = new ModelDataService_1.ModelDataService(pool, this);
        this.controlService = new ControlDataService_1.ControlDataService(pool, this);
        this.threatService = new ThreatDataService_1.ThreatDataService(pool, this);
        this.mitigationService = new MitigationDataService_1.MitigationDataService(pool);
        this.notificationService = new NotificationDataService_1.NotificationDataService(pool, this);
        this.reviewService = new ReviewDataService_1.ReviewDataService(pool, this);
        this.suggestionService = new SuggestionDataService_1.SuggestionDataService(pool, this);
        this.suggestionEngine = new engine_1.SuggestionEngine(this);
        this.reportService = new ReportDataService_1.ReportDataService(pool, this);
        this.bannerService = new BannerDataService_1.BannerDataService(pool, this);
    }
}
exports.DataAccessLayer = DataAccessLayer;
//# sourceMappingURL=dal.js.map