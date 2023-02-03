"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateHandler = void 0;
const logger_1 = require("../logger");
const log = (0, logger_1.getLogger)("TemplateHandler");
class TemplateHandler {
    constructor() {
        this.templates = new Map();
    }
    register(template) {
        this.templates.set(template.key, template);
        log.info(`Registered notification template: ${template.key}`);
    }
    render(key, variables) {
        const template = this.templates.get(key);
        if (!template) {
            throw new Error(`No such notification template ${key}`);
        }
        return template.render(variables);
    }
    get(key) {
        return this.templates.get(key);
    }
}
exports.TemplateHandler = TemplateHandler;
//# sourceMappingURL=TemplateHandler.js.map