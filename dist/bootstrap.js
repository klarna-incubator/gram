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
exports.bootstrapPlugins = void 0;
const plugin_1 = require("@gram/core/dist/plugin");
const index_1 = __importDefault(require("@gram/aws/dist/index"));
const index_2 = __importDefault(require("@gram/svgporn/dist/index"));
// import StaticPlugin from "@gram/plugin-static";
// import ThreatLibPlugin from "@gram/plugin-threatlib";
// import GithubPlugin from "@gram/plugin-github";
function bootstrapPlugins(app, dal) {
    return __awaiter(this, void 0, void 0, function* () {
        const compiler = new plugin_1.PluginCompiler(dal, app);
        yield Promise.all([
            new index_1.default().bootstrap(compiler),
            new index_2.default().bootstrap(compiler),
            // new GithubPlugin().bootstrap(compiler),
            // new StaticPlugin().bootstrap(compiler),
            // new ThreatLibPlugin().bootstrap(compiler),
        ]);
        compiler.compileAssets();
    });
}
exports.bootstrapPlugins = bootstrapPlugins;
//# sourceMappingURL=bootstrap.js.map