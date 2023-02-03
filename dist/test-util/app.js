"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = void 0;
const app_1 = __importDefault(require("../app"));
const postgres_1 = require("@gram/core/dist/data/postgres");
const plugin_1 = require("@gram/core/dist/plugin");
const authz_1 = require("./authz");
const sampleNotifications_1 = require("./sampleNotifications");
const sampleUser_1 = require("./sampleUser");
const system_1 = require("./system");
const classes_json_1 = __importDefault(require("./classes.json"));
const sampleReviewer_1 = require("./sampleReviewer");
const toComponentClass = (o) => {
    return {
        id: o.id,
        name: o.name,
        icon: o.icon,
        componentType: o.componentType,
    };
};
class TestPack {
    bootstrap(reg) {
        return __awaiter(this, void 0, void 0, function* () {
            reg.setAuthzProvider(authz_1.testAuthzProvider);
            reg.setSystemProvider(system_1.testSystemProvider);
            reg.registerNotificationTemplates([
                sampleNotifications_1.SampleEmailReviewApproved,
                sampleNotifications_1.SampleEmailMeetingRequested,
                sampleNotifications_1.SampleEmailRequested,
            ]);
            reg.setUserProvider(sampleUser_1.testUserProvider);
            reg.setReviewerProvider(sampleReviewer_1.testReviewerProvider);
            reg.registerComponentClasses(classes_json_1.default.map((logo) => toComponentClass(logo)));
        });
    }
}
function createTestApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield (0, postgres_1.createPostgresPool)();
        const { app, dal } = yield (0, app_1.default)(pool);
        const compiler = new plugin_1.PluginCompiler(dal, app);
        const pack = new TestPack();
        yield pack.bootstrap(compiler);
        return { pool, app, dal };
    });
}
exports.createTestApp = createTestApp;
//# sourceMappingURL=app.js.map