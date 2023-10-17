import { randomUUID } from "crypto";
import pg from "pg";
import {
  EngineSuggestedResult,
  SuggestionID,
} from "../../suggestions/models.js";
import { createSampleModel } from "../../test-util/model.js";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../../test-util/suggestions.js";
import Control from "../controls/Control.js";
import { DataAccessLayer } from "../dal.js";
import { createPostgresPool } from "../postgres.js";
import Threat from "../threats/Threat.js";
import { _deleteAllTheThings } from "../utils.js";
import {
  SuggestedControl,
  SuggestedThreat,
  SuggestionStatus,
} from "./Suggestion.js";

describe("SuggestionDataService implementation", () => {
  let pool: pg.Pool;
  let dal: DataAccessLayer;
  let modelId: string;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);

    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("bulkInsert", () => {
    it("should be able to insert empty threats and controls", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [],
        threats: [],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);
    });

    it("should be able to insert multiple threats and controls", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(50)].map(genSuggestedControl),
        threats: [...new Array(50)].map(genSuggestedThreat),
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);
      const controls = await dal.suggestionService.listControlSuggestions(
        modelId
      );
      expect(controls.length).toBe(50);
      expect(controls[0].status).toBe(SuggestionStatus.New);
      expect(controls[0].source).toBe("test");
      expect(controls[0].modelId).toBe(modelId);
    });

    it("should remove unused suggestions that are no longer included in the batch, but keep ones that have been added/rejected", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(50)].map(genSuggestedControl),
        threats: [...new Array(50)].map(genSuggestedThreat),
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      // Set some as added/rejected
      await Promise.all(
        suggestions.controls
          .slice(25, 30)
          .map((c) =>
            dal.suggestionService.acceptSuggestion(modelId, c.id, "someuser")
          )
      );

      await Promise.all(
        suggestions.threats
          .slice(25, 30)
          .map((t) =>
            dal.suggestionService.setSuggestionStatus(
              modelId,
              t.id,
              SuggestionStatus.Rejected
            )
          )
      );

      const suggestionsAfter: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: suggestions.controls.slice(0, 25),
        threats: suggestions.threats.slice(0, 25),
      };
      expect(suggestionsAfter.controls).toHaveLength(25);
      await dal.suggestionService.bulkInsert(modelId, suggestionsAfter);

      let res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(30);
      expect(
        res.filter((t) => t.status == SuggestionStatus.Rejected).length
      ).toBe(5);

      res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(30);
      expect(
        res.filter((t) => t.status == SuggestionStatus.Accepted).length
      ).toBe(5);
    });

    it("should not have different sources interfering with each others' batches", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(50)].map(genSuggestedControl),
        threats: [...new Array(50)].map(genSuggestedThreat),
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const suggestionsAfter = {
        sourceSlug: "test-2",
        controls: [genSuggestedControl()],
        threats: [],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestionsAfter);

      let res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(50);

      res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(51);
    });

    it("should not have different models interfering with each others' batches", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(3)].map(genSuggestedControl),
        threats: [...new Array(4)].map(genSuggestedThreat),
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const suggestionsAfter: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [genSuggestedControl()],
        threats: [],
      };

      const anotherModelId = await createSampleModel(dal);
      await dal.suggestionService.bulkInsert(anotherModelId, suggestionsAfter);

      let res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(4);

      res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(3);

      res = await dal.suggestionService.listControlSuggestions(anotherModelId);
      expect(res).toHaveLength(1);
    });

    it("should insert control suggestions with empty mitigations", async () => {
      const suggestionsAfter: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [genSuggestedControl()],
        threats: [],
      };

      await dal.suggestionService.bulkInsert(modelId, suggestionsAfter);

      const res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(0);

      const controlres = await dal.suggestionService.listControlSuggestions(
        modelId
      );
      expect(controlres).toHaveLength(1);

      expect(controlres[0].mitigates).toHaveLength(0);
    });

    it("should insert control suggestions with list of mitigations", async () => {
      const suggestThreats = [...Array(10)].map(genSuggestedThreat);
      const partialThreatIds = suggestThreats.map((t: any) =>
        t.id.val.split("/").slice(1).join("/")
      );
      const suggestControl = genSuggestedControl({
        mitigates: partialThreatIds.map((partialThreatId: string) => ({
          partialThreatId,
        })),
      });
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [suggestControl],
        threats: suggestThreats,
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(10);

      const controlres = await dal.suggestionService.listControlSuggestions(
        modelId
      );
      expect(controlres).toHaveLength(1);
      expect(controlres[0].mitigates).toHaveLength(10);
      expect(controlres[0].mitigates.map((m) => m.partialThreatId)).toEqual(
        partialThreatIds
      );
    });
  });

  describe("listControlSuggestions", () => {
    it("should return an empty list if no suggestions", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [],
        threats: [],
      };

      await dal.suggestionService.bulkInsert(modelId, suggestions);
      const res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(0);
    });

    it("should return a list", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(50)].map(() => genSuggestedControl()),
        threats: [],
      };

      await dal.suggestionService.bulkInsert(modelId, suggestions);
      const res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(50);
      res.forEach((element) => {
        expect(element.modelId).toBe(modelId);
      });
    });

    it("should return the correct list", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [...new Array(50)].map(() => genSuggestedControl()),
        threats: [],
      };

      await dal.suggestionService.bulkInsert(modelId, suggestions);
      const anotherModelId = await createSampleModel(dal);
      await dal.suggestionService.bulkInsert(anotherModelId, suggestions);

      const res = await dal.suggestionService.listControlSuggestions(modelId);
      expect(res).toHaveLength(50);
      res.forEach((element) => {
        expect(element.modelId).toBe(modelId);
      });
    });
  });

  describe("listThreatSuggestions", () => {
    it("should return an empty list if no suggestions", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [],
        threats: [],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(0);
    });

    it("should return a list", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [],
        threats: [...new Array(50)].map(() => genSuggestedThreat()),
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const res = await dal.suggestionService.listThreatSuggestions(modelId);
      expect(res).toHaveLength(50);
      res.forEach((element) => {
        expect(element.modelId).toBe(modelId);
      });
    });
  });

  describe("acceptSuggestion", () => {
    it("should return false if suggestion not found", async () => {
      const res = await dal.suggestionService.acceptSuggestion(
        modelId,
        new SuggestionID(`${randomUUID()}/test-source/threat/test-1-23`),
        "someuser"
      );
      expect(res).toBe(false);
    });
    it("should return true if suggestion is control or threat", async () => {
      const suggestThreat = genSuggestedThreat();
      const suggestControl = genSuggestedControl({
        mitigates: [
          {
            partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/"),
          },
        ],
      });
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [suggestControl],
        threats: [suggestThreat],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      let res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestions.controls[0].id,
        "someuser"
      );
      expect(res).toBe(true);
      let suggestion = (await dal.suggestionService.getById(
        modelId,
        suggestions.controls[0].id
      )) as SuggestedControl | SuggestedThreat;
      expect(suggestion.status).toBe(SuggestionStatus.Accepted);
      const control = await dal.suggestionService._getLinkedThreatOrControl(
        modelId,
        suggestions.controls[0].id
      );
      expect(control.title).toEqual(suggestion.title);
      expect(control.description).toEqual(suggestion.description);

      // At this point, no mitigation should exist.
      res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestions.threats[0].id,
        "someuser"
      );
      expect(res).toBe(true);
      suggestion = (await dal.suggestionService.getById(
        modelId,
        suggestions.threats[0].id
      )) as SuggestedThreat;
      expect(suggestion.status).toBe(SuggestionStatus.Accepted);
    });

    it("should create mitigation(s) if relevant threat exists", async () => {
      const suggestThreats = [...Array(5)].map(genSuggestedThreat);
      const suggestControl = genSuggestedControl({
        mitigates: suggestThreats.map((suggestThreat) => ({
          partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/"),
        })),
      });
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [suggestControl],
        threats: suggestThreats,
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      await Promise.all(
        suggestThreats.map(async (suggestedThreat) => {
          const res = await dal.suggestionService.acceptSuggestion(
            modelId,
            suggestedThreat.id,
            "someuser"
          );
          expect(res).toBe(true);
        })
      );

      const res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestions.controls[0].id,
        "someuser"
      );
      expect(res).toBe(true);
      const control = (await dal.suggestionService._getLinkedThreatOrControl(
        modelId,
        suggestions.controls[0].id
      )) as Control;

      await Promise.all(
        suggestThreats.map(async (suggestedThreat) => {
          const threat = (await dal.suggestionService._getLinkedThreatOrControl(
            modelId,
            suggestedThreat.id
          )) as Threat;
          expect(threat.title).toEqual(suggestedThreat.title);
          expect(threat.description).toEqual(suggestedThreat.description);
          const mitigation = await dal.mitigationService.getById(
            threat.id!,
            control.id!
          );
          expect(mitigation).toBeTruthy();
        })
      );
    });

    it("should NOT create mitigation if relevant threat does NOT exists", async () => {
      const suggestThreat = genSuggestedThreat();
      const suggestControl = genSuggestedControl({
        mitigates: [
          {
            partialThreatId:
              suggestThreat.id.val.split("/").slice(1).join("/") +
              "not-the-same",
          },
        ],
      });
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [suggestControl],
        threats: [suggestThreat],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      let res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestions.threats[0].id,
        "someuser"
      );
      expect(res).toBe(true);
      const threat = (await dal.suggestionService._getLinkedThreatOrControl(
        modelId,
        suggestions.threats[0].id
      )) as Threat;
      expect(threat.title).toEqual(suggestThreat.title);
      expect(threat.description).toEqual(suggestThreat.description);

      res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestions.controls[0].id,
        "someuser"
      );
      expect(res).toBe(true);
      const control = (await dal.suggestionService._getLinkedThreatOrControl(
        modelId,
        suggestions.controls[0].id
      )) as Control;

      const mitigation = await dal.mitigationService.getById(
        threat.id!,
        control.id!
      );
      expect(mitigation).toBeNull();
    });

    it("should NOT list deleted threats from partialId", async () => {
      const suggestThreat = genSuggestedThreat();
      const suggestControl = genSuggestedControl({
        mitigates: [
          {
            partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/"),
          },
        ],
      });
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [suggestControl],
        threats: [suggestThreat],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      const res = await dal.suggestionService.acceptSuggestion(
        modelId,
        suggestThreat.id,
        "someuser"
      );
      expect(res).toBe(true);

      const reslist = await dal.threatService
        .list(modelId)
        .then((res) => res.find((t) => t.title === suggestThreat.title));
      await dal.threatService.delete(modelId, reslist!.id!);
      const respartial =
        await dal.suggestionService.getThreatsByPartialSuggestion(modelId, [
          suggestControl.mitigates[0].partialThreatId,
        ]);
      expect(respartial).toEqual([]);
    });
  });

  describe("setSuggestionStatus", () => {
    it("should return false if suggestion not found", async () => {
      const res = await dal.suggestionService.setSuggestionStatus(
        modelId,
        new SuggestionID(`${randomUUID()}/test-source/threat/test-1-23`),
        SuggestionStatus.Rejected
      );
      expect(res).toBe(false);
    });

    it("should be able to set all statuses", async () => {
      const suggestions: EngineSuggestedResult = {
        sourceSlugToClear: "test",
        controls: [genSuggestedControl()],
        threats: [genSuggestedThreat()],
      };
      await dal.suggestionService.bulkInsert(modelId, suggestions);

      [
        SuggestionStatus.Accepted,
        SuggestionStatus.New,
        SuggestionStatus.Rejected,
      ].forEach(async (status) => {
        let res = await dal.suggestionService.setSuggestionStatus(
          modelId,
          suggestions.threats[0].id,
          status
        );
        expect(res).toBe(true);
        res = await dal.suggestionService.setSuggestionStatus(
          modelId,
          suggestions.controls[0].id,
          status
        );
        expect(res).toBe(true);

        const controls = await dal.suggestionService.listControlSuggestions(
          modelId
        );
        expect(controls[0].status).toBe(status);
        const threats = await dal.suggestionService.listThreatSuggestions(
          modelId
        );
        expect(threats[0].status).toBe(status);
      });
    });
  });
});
