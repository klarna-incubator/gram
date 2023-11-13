import { randomUUID } from "crypto";
import pg from "pg";
import { DataAccessLayer } from "../data/dal.js";
import { createPostgresPool } from "../data/postgres.js";
import { createSampleModel } from "../test-util/model.js";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../test-util/suggestions.js";
import { SuggestionEngine } from "./engine.js";
import {
  EngineSuggestedControl,
  EngineSuggestedThreat,
  SuggestionID,
  SuggestionSource,
} from "./models.js";

const EmptySuggestionSource: SuggestionSource = {
  name: "empty",
  slug: "empty",
  suggest: async () => ({ controls: [], threats: [] }),
};

const suggestedControl = genSuggestedControl();
const suggestedThreat = genSuggestedThreat();

const SampleSuggestionSource = (
  name: string,
  threats: EngineSuggestedThreat[] = [],
  controls: EngineSuggestedControl[] = [suggestedControl]
): SuggestionSource => ({
  name,
  slug: name,
  suggest: async () => ({
    controls: controls.map((c) => ({ ...c, source: name })),
    threats: threats.map((c) => ({ ...c, source: name })),
  }),
});

const ErroringSuggestionSource: SuggestionSource = {
  name: "errors",
  slug: "errors",
  suggest: async () => {
    throw new Error("boom!");
  },
};

describe("SuggestionEngine", () => {
  let dal: DataAccessLayer;
  let modelId: string;
  let engine: SuggestionEngine;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    engine = new SuggestionEngine(dal, true);
  });

  beforeEach(async () => {
    engine.sources = []; // Disable the builtin engine
    modelId = await createSampleModel(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  it("should handle suggestionsource errors gracefully", async () => {
    engine.register(ErroringSuggestionSource);
    await engine.work(modelId);
  });

  //   it("benchmark, should handle medium loads ok", () => {});

  //   it("should delete suggestions if components are deleted", () => {});

  it("should return empty by default", async () => {
    const result = await engine.suggest(modelId);
    expect(result.length).toBe(0);
  });

  it("should return empty by default if model doesnt exist", async () => {
    const result = await engine.suggest(randomUUID());
    expect(result.length).toBe(0);
  });

  it("should return empty SuggestionResult by default if source does not have any suggestions", async () => {
    engine.register(EmptySuggestionSource);
    const result = await engine.suggest(modelId);
    expect(result.length).toBe(1);
    const awaited = await Promise.all(result);
    expect(awaited[0].controls.length).toBe(0);
    expect(awaited[0].threats.length).toBe(0);
  });

  it("should be able to use a single source", async () => {
    engine.register(SampleSuggestionSource("sample"));
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedControl, id: undefined, source: "sample" },
    ]);
  });

  it("should insert suggested threats", async () => {
    engine.register(SampleSuggestionSource("sample", [suggestedThreat], []));
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls).toHaveLength(0);
    expect(result.threats.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedThreat, id: undefined, source: "sample" },
    ]);
  });

  it("should insert suggested controls", async () => {
    engine.register(SampleSuggestionSource("sample"));
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedControl, id: undefined, source: "sample" },
    ]);
    expect(result.threats).toHaveLength(0);
  });

  it("should combine results for multiple sources", async () => {
    engine.register(SampleSuggestionSource("sample1"));
    engine.register(SampleSuggestionSource("sample2"));
    const result = await engine.suggest(modelId);

    expect(result.length).toEqual(2);

    const awaited = await Promise.all(result);
    expect(awaited[0].controls.length).toBe(1);
    expect(awaited[1].controls.length).toBe(1);
    expect([awaited[0].controls[0], awaited[1].controls[0]]).toEqual([
      {
        ...suggestedControl,
        id: new SuggestionID(
          `${suggestedControl.componentId}/sample1/control/${suggestedControl.slug}`
        ),
        source: "sample1",
      },
      {
        ...suggestedControl,
        id: new SuggestionID(
          `${suggestedControl.componentId}/sample2/control/${suggestedControl.slug}`
        ),
        source: "sample2",
      },
    ]);
  });
});
