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
Object.defineProperty(exports, "__esModule", { value: true });
const SystemPropertyHandler_1 = require("./SystemPropertyHandler");
describe("SystemPropertyProvider implementation", () => {
    describe("contextualize", () => {
        it("should not crash if a provider crashes", () => __awaiter(void 0, void 0, void 0, function* () {
            const niceProvider = {
                id: "nice",
                definitions: [],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () { return []; }),
                provideSystemProperties: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
            };
            const badProvider = {
                id: "bad",
                definitions: [],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () {
                    throw new Error("not good");
                }),
                provideSystemProperties: () => __awaiter(void 0, void 0, void 0, function* () {
                    throw new Error("not good");
                }),
            };
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            handler.registerSystemPropertyProvider(niceProvider);
            handler.registerSystemPropertyProvider(badProvider);
            const items = yield handler.contextualize({}, "some-system-id");
            const expected = [];
            expect(items).toStrictEqual(expected);
        }));
        it("should return properties", () => __awaiter(void 0, void 0, void 0, function* () {
            const niceProvider = {
                id: "nice",
                definitions: [],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () { return []; }),
                provideSystemProperties: (systemObjectId, quick) => __awaiter(void 0, void 0, void 0, function* () {
                    return [
                        {
                            batchFilterable: false,
                            displayInList: false,
                            id: "some-prop",
                            label: "some property",
                            value: "yes",
                            description: "longer description",
                        },
                    ];
                }),
            };
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            handler.registerSystemPropertyProvider(niceProvider);
            const items = yield handler.contextualize({}, "some-system-id");
            const expected = [
                {
                    batchFilterable: false,
                    displayInList: false,
                    id: "some-prop",
                    label: "some property",
                    value: "yes",
                    description: "longer description",
                    source: "nice",
                },
            ];
            expect(items).toStrictEqual(expected);
        }));
        it("should return empty when no providers", () => __awaiter(void 0, void 0, void 0, function* () {
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            const items = yield handler.contextualize({}, "some-system-id");
            const expected = [];
            expect(items).toStrictEqual(expected);
        }));
    });
    describe("list", () => {
        it("should not crash if a provider crashes", () => __awaiter(void 0, void 0, void 0, function* () {
            const niceProvider = {
                id: "nice",
                definitions: [
                    { batchFilterable: true, id: "good-prop", label: "good-prop" },
                ],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () { return []; }),
                provideSystemProperties: () => __awaiter(void 0, void 0, void 0, function* () { return []; }),
            };
            const badProvider = {
                id: "bad",
                definitions: [
                    { batchFilterable: true, id: "bad-prop", label: "bad-prop" },
                ],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () {
                    throw new Error("not good");
                }),
                provideSystemProperties: () => __awaiter(void 0, void 0, void 0, function* () {
                    throw new Error("not good");
                }),
            };
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            handler.registerSystemPropertyProvider(niceProvider);
            handler.registerSystemPropertyProvider(badProvider);
            const items = yield handler.listSystemsByFilters({}, [
                { propertyId: "good-prop", value: "yes" },
                { propertyId: "bad-prop", value: "42" },
            ]);
            const expected = [];
            expect(items).toStrictEqual(expected);
        }));
        it("should return systems", () => __awaiter(void 0, void 0, void 0, function* () {
            const niceProvider = {
                id: "nice",
                definitions: [
                    { batchFilterable: true, id: "good-prop", label: "good-prop" },
                ],
                listSystemByPropertyValue: (filters) => __awaiter(void 0, void 0, void 0, function* () {
                    return [
                        "some-system-id",
                        "another-one",
                    ];
                }),
                provideSystemProperties: (systemObjectId, quick) => __awaiter(void 0, void 0, void 0, function* () { return []; }),
            };
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            handler.registerSystemPropertyProvider(niceProvider);
            const items = yield handler.listSystemsByFilters({}, [
                { propertyId: "good-prop", value: "yes" },
            ]);
            const expected = ["some-system-id", "another-one"];
            expect(items).toStrictEqual(expected);
        }));
        it("should return empty when no providers", () => __awaiter(void 0, void 0, void 0, function* () {
            const handler = new SystemPropertyHandler_1.SystemPropertyHandler();
            const items = yield handler.listSystemsByFilters({}, [
                { propertyId: "good-prop", value: "yes" },
            ]);
            const expected = [];
            expect(items).toStrictEqual(expected);
        }));
    });
});
//# sourceMappingURL=SystemPropertyHandler.spec.js.map