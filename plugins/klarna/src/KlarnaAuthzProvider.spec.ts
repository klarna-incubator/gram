import Model from "@gram/core/dist/data/models/Model";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review";
import { Pool } from "pg";
import { systemProvider } from "@gram/core/dist/data/systems/systems";
import { Permission, AllRoles } from "@gram/core/dist/auth/authorization";
import { Role } from "@gram/core/dist/auth/models/Role";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { createPostgresPool } from "@gram/core/dist/data/postgres";
import { KlarnaAuthzProvider } from "./KlarnaAuthzProvider";
import { sampleOwnedSystem } from "@gram/core/dist/test-util/sampleOwnedSystem";
import {
  OctaneSystem,
  OctaneSystemProvider,
} from "./system/OctaneSystemProvider";
import { genUser } from "@gram/core/dist/test-util/authz";

const getSystem = jest.spyOn(systemProvider, "getSystem");

const reviewTemplate = (): Review => ({
  modelId: "123",
  requestedBy: "Nice team",
  reviewedBy: "Secure Engineer",
  status: ReviewStatus.Requested,
  note: "",
  createdAt: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000),
  approvedAt: null,
  meetingRequestedAt: null,
  meetingRequestedReminderSentCount: 0,
  requestedAt: null,
  requestedReminderSentCount: 0,
  extras: {},
  toJSON: function (): {
    modelId: string;
    requestedBy: string;
    reviewedBy: string;
    createdAt: Date;
    updatedAt: Date;
    approvedAt: Date | null;
    requestedAt: Date | null;
    requestedReminderSentCount: number;
    status: ReviewStatus;
    note: string;
    meetingRequestedAt: Date | null;
    meetingRequestedReminderSentCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extras: any;
  } {
    throw new Error("Function not implemented.");
  },
});

let pool: Pool;
let dal: DataAccessLayer;
let authz: KlarnaAuthzProvider;
const octaneSystemProvider = new OctaneSystemProvider();
const getOctaneSystem = jest.spyOn(octaneSystemProvider, "getOctaneSystem");

beforeAll(async () => {
  pool = await createPostgresPool();
  dal = new DataAccessLayer(pool);
  authz = new KlarnaAuthzProvider(dal, octaneSystemProvider);
});

const teamId = "21";

const octaneSystem: Partial<OctaneSystem> = {
  team: {
    accountability_code: teamId,
  },
  ...sampleOwnedSystem,
};

describe("Authorization", () => {
  describe("getPermissionsForSystem", () => {
    beforeAll(() =>
      getSystem.mockImplementation(async () => sampleOwnedSystem)
    );
    beforeAll(() =>
      getOctaneSystem.mockImplementation(async () => octaneSystem)
    );
    it("should return full permissions for admin", async () => {
      const permissions = await authz.getPermissionsForSystem(
        {},
        "123",
        genUser({
          sub: "cool.admin",
          teams: [],
          roles: [Role.Admin],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Write,
          Permission.Review,
          Permission.Delete,
        ].sort()
      );
    });

    it("should return full permissions for admin if owner", async () => {
      const permissions = await authz.getPermissionsForSystem(
        {},
        "123",
        genUser({
          sub: "cool.admin",
          teams: [{ name: "tester team", id: teamId }],
          roles: [Role.Admin],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Write,
          Permission.Review,
          Permission.Delete,
        ].sort()
      );
    });

    it("should return no permissions with no roles", async () => {
      const permissions = await authz.getPermissionsForSystem(
        {},
        "123",
        genUser({
          sub: "anon",
          teams: [],
          roles: [],
        })
      );

      expect(permissions.sort()).toStrictEqual([].sort());
    });

    it("should return read/write/delete permissions for owner team (systemid) regardless of role", async () => {
      await Promise.all(
        AllRoles.map(async (r) => {
          const permissions = await authz.getPermissionsForSystem(
            {},
            "123",
            genUser({
              sub: "lovely.team.member",
              teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
              roles: [r],
            })
          );

          expect(permissions).toContain(Permission.Read);
          expect(permissions).toContain(Permission.Write);
          expect(permissions).toContain(Permission.Delete);
        })
      );
    });

    it("should return no permission if owner but no roles", async () => {
      const permissions = await authz.getPermissionsForSystem(
        {},
        "123",
        genUser({
          sub: "lovely.team.member",
          teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
          roles: [],
        })
      );

      expect(permissions.sort()).toStrictEqual([]);
    });
  });

  describe("getPermissionsForModel", () => {
    let getMockReviewById: any;
    let mockReview: Review;

    beforeAll(async () => {
      getSystem.mockImplementation(async () => sampleOwnedSystem);
      getMockReviewById = jest.spyOn(dal.reviewService, "getByModelId");
    });

    beforeEach(() => {
      mockReview = reviewTemplate();
    });

    afterAll(async () => {
      getSystem.mockRestore();
      getMockReviewById.mockRestore();
      await pool.end();
    });

    it("should return full permissions for admin", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("123", "whatever", "root"),
        genUser({
          sub: "cool.admin",
          teams: [],
          roles: [Role.User, Role.Reviewer, Role.Admin],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Write,
          Permission.Review,
          Permission.Delete,
        ].sort()
      );
    });

    it("should return full permissions for admin (no systemId)", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("00000000-0000-0000-0000-000000000000", "whatever", "root"),
        genUser({
          sub: "cool.admin",
          teams: [],
          roles: [Role.User, Role.Reviewer, Role.Admin],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Write,
          Permission.Review,
          Permission.Delete,
        ].sort()
      );
    });

    it("should return read/review/write permissions for assigned reviewer", async () => {
      getMockReviewById.mockImplementation(async () => mockReview);
      const mockModel = new Model("123", "whatever", "root");
      mockModel.id = "this is not a real id";

      const permissions = await authz.getPermissionsForModel(
        mockModel,
        genUser({
          sub: mockReview.reviewedBy,
          teams: [],
          roles: [Role.User, Role.Reviewer],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Review, // Note: no delete
          Permission.Write,
        ].sort()
      );
    });

    it("should return read permissions for non-assigned reviewer", async () => {
      getMockReviewById.mockImplementation(async () => mockReview);
      const mockModel = new Model("123", "whatever", "root");
      mockModel.id = "this is not a real id";

      const permissions = await authz.getPermissionsForModel(
        mockModel,
        genUser({
          sub: "someone else",
          teams: [],
          roles: [Role.User, Role.Reviewer],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [Permission.Read, Permission.Write].sort()
      );
    });

    it("should return read/write/delete permissions for owner team (systemid)", async () => {
      await Promise.all(
        AllRoles.map(async (r) => {
          const permissions = await authz.getPermissionsForModel(
            new Model("123", "whatever", "root"),
            genUser({
              sub: "lovely.team.member",
              teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
              roles: [r],
            })
          );

          expect(permissions).toContain(Permission.Read);
          expect(permissions).toContain(Permission.Write);
          expect(permissions).toContain(Permission.Delete);
        })
      );
    });

    it("should return read/write/delete permissions for createdBy owner", async () => {
      await Promise.all(
        AllRoles.map(async (r) => {
          const permissions = await authz.getPermissionsForModel(
            new Model("", "whatever", "lovely.team.member"),
            genUser({
              sub: "lovely.team.member",
              teams: [], // teamId here is the same as mocked system
              roles: [r],
            })
          );

          expect(permissions).toContain(Permission.Read);
          expect(permissions).toContain(Permission.Write);
          expect(permissions).toContain(Permission.Delete);
        })
      );
    });

    it("should return no model permission if no roles", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("123", "whatever", "root"),
        genUser({
          sub: "lovely.team.member",
          teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
          roles: [],
        })
      );

      expect(permissions.sort()).toStrictEqual([]);
    });

    it("should return no permission if system owner but no roles", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("123", "whatever", "root"),
        genUser({
          sub: "lovely.team.member",
          teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
          roles: [],
        })
      );

      expect(permissions.sort()).toStrictEqual([]);
    });

    it("should return full permissions for owner team (systemid) if also reviewer", async () => {
      getMockReviewById.mockImplementation(async () => mockReview);

      const mockModel = new Model("123", "whatever", "root");
      mockModel.id = "this is not a real id";

      const permissions = await authz.getPermissionsForModel(
        mockModel,
        genUser({
          sub: mockReview.reviewedBy,
          teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
          roles: [Role.Reviewer],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [
          Permission.Read,
          Permission.Write,
          Permission.Delete,
          Permission.Review,
        ].sort()
      );
    });

    it("should return read/write/delete permissions for owner user (no systemid)", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("", "whatever", "user-owner"),
        genUser({
          sub: "user-owner",
          teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
          roles: [Role.User],
        })
      );

      expect(permissions.sort()).toStrictEqual(
        [Permission.Read, Permission.Write, Permission.Delete].sort()
      );
    });

    it("should return read permissions for regular users", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("123", "whatever", "root"),
        genUser({
          sub: "klarnaut",
          teams: [{ name: "other tester team", id: "24" }],
          roles: [Role.User],
        })
      );

      expect(permissions.sort()).toStrictEqual([Permission.Read].sort());
    });

    it("should return no permissions for users with no roles", async () => {
      const permissions = await authz.getPermissionsForModel(
        new Model("123", "whatever", "root"),
        genUser({
          sub: "evil hacker",
          teams: [{ name: "hacker team", id: "-1337" }],
          roles: [],
        })
      );

      expect(permissions).toStrictEqual([]);
    });

    it("should not return write permission when model is approved", async () => {
      // Make getByModelId return a review approved 2 weeks ago
      mockReview.status = ReviewStatus.Approved;
      getMockReviewById.mockImplementation(async () => mockReview);

      // Define model with modelId
      const mockModel = new Model("123", "whatever", "root");
      mockModel.id = "this is not a real id";

      await Promise.all(
        AllRoles.map(async (r) => {
          const permissions = await authz.getPermissionsForModel(
            mockModel,
            genUser({
              sub: "lovely.team.member",
              teams: [{ name: "tester team", id: teamId }], // teamId here is the same as mocked system
              roles: [r],
            })
          );
          expect(permissions).not.toContain(Permission.Write);
        })
      );
    });
  });
});
