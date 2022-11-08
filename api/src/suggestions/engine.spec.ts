import { randomUUID } from "crypto";
import { Pool } from "pg";
import { DataAccessLayer } from "../data/dal";
import { createPostgresPool } from "../data/postgres";
import { createSampleModel } from "../test-util/model";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../test-util/suggestions";
import { SuggestionEngine } from "./engine";
import {
  EngineSuggestedControl,
  EngineSuggestedThreat,
  SuggestionID,
  SuggestionSource,
} from "./models";

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
    controls,
    threats,
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
  let pool: Pool;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    dal.suggestionEngine.sources = []; // Disable the builtin engine
  });

  beforeEach(async () => {
    dal.suggestionEngine.sources = []; // Disable the builtin engine
  });

  afterEach(async () => {
    dal.suggestionEngine.sources = []; // Disable the builtin engine
  });

  it("should handle suggestionsource errors gracefully", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(ErroringSuggestionSource);
    const modelId = await createSampleModel(dal);
    await engine.work(modelId);
  });

  //   it("benchmark, should handle medium loads ok", () => {});

  //   it("should delete suggestions if components are deleted", () => {});

  it("should return empty by default", async () => {
    const engine = new SuggestionEngine(dal);
    const modelId = await createSampleModel(dal);
    const result = await engine.suggest(modelId);
    expect(result.length).toBe(0);
  });

  it("should return empty by default if model doesnt exist", async () => {
    const engine = new SuggestionEngine(dal);
    const result = await engine.suggest(randomUUID());
    expect(result.length).toBe(0);
  });

  it("should return empty SuggestionResult by default if source does not have any suggestions", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(EmptySuggestionSource);
    const modelId = await createSampleModel(dal);
    const result = await engine.suggest(modelId);
    expect(result.length).toBe(1);
    const awaited = await Promise.all(result);
    expect(awaited[0].controls.length).toBe(0);
    expect(awaited[0].threats.length).toBe(0);
  });

  it("should be able to use a single source", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(SampleSuggestionSource("sample"));
    const modelId = await createSampleModel(dal);
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedControl, id: undefined },
    ]);
  });

  it("should insert suggested threats", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(SampleSuggestionSource("sample", [suggestedThreat], []));
    const modelId = await createSampleModel(dal);
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls).toHaveLength(0);
    expect(result.threats.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedThreat, id: undefined },
    ]);
  });

  it("should insert suggested controls", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(SampleSuggestionSource("sample"));
    const modelId = await createSampleModel(dal);
    const result = await (await engine.suggest(modelId))[0];
    expect(result.controls.map((r) => ({ ...r, id: undefined }))).toEqual([
      { ...suggestedControl, id: undefined },
    ]);
    expect(result.threats).toHaveLength(0);
  });

  it("should combine results for multiple sources", async () => {
    const engine = new SuggestionEngine(dal);
    engine.register(SampleSuggestionSource("sample1"));
    engine.register(SampleSuggestionSource("sample2"));
    const modelId = await createSampleModel(dal);
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
      },
      {
        ...suggestedControl,
        id: new SuggestionID(
          `${suggestedControl.componentId}/sample2/control/${suggestedControl.slug}`
        ),
      },
    ]);
  });
});
