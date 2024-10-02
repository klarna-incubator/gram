import { ComponentClass } from "../component-classes/index.js";

export interface DataFlow {
  id: string;
  endComponent: { id: string };
  startComponent: { id: string };
  label?: string;
  points: number[];
  bidirectional: boolean;
}

type ComponentType = "ee" | "ds" | "proc" | "tb";

// type AuthenticationType =
//   | "json-web-token"
//   | "basic-authentication/user-pass"
//   | "one-time-password/single-sign-on"
//   | "iam";

// type InjectionMitigationType =
//   | "input-sanitation"
//   | "stored-procedures"
//   | "parameterized-queries"
//   | "schema-validation";

// type SecretsStorageType =
//   | "plaintext"
//   | "git-crypt"
//   | "aws-secrets-manager"
//   | "aws-systems-manager"
//   | "c2c-secrets";

// export interface Attributes {
//   /*
//     Protocol
//   */
//   protocolTLS?: boolean;

//   /*
//     Logging
//   */
//   logs?: boolean;
//   auditLogs?: boolean;
//   accessLogs?: boolean;
//   sensitiveDataMaskedInLogs?: boolean;
//   logIntegrityProtection?: boolean;
//   restrictedLogAccess?: boolean;

//   /*
//     Authentication and Authorization

//     Skipping for now:
//       * is the authentication weak or strong?
//       * are there security controls on all the endpoints?
//   */
//   authentication?: boolean | AuthenticationType;
//   individualAccounts?: boolean;
//   individualRolesPerUser?: boolean;

//   /*
//     Data

//     Skipping for now:
//       * SSRF
//       * EVCC
//       * user generated data
//   */
//   inputValidation?: boolean;
//   injectionMitigation?: boolean | InjectionMitigationType;

//   /*
//     Denial of service
//   */

//   // Ask if exposed to the internet
//   ddosProtection?: boolean;

//   /*
//     Secret storage
//   */
//   secureSecretsStorage?: boolean | SecretsStorageType;

//   /*
//     Access to production restricted
//   */
//   limitedTeamAccessToProductionAsset?: boolean;

//   /*
//     Errors

//     Skipping for now:
//       * sensitive data/information in error messages
//   */

//   /*
//     Data store
//   */
//   encryptionAtRest?: boolean;
//   safeCredentialStorage?: boolean;
//   backups?: boolean;
// }

export interface Component {
  id: string;
  x: number;
  y: number;
  type: ComponentType;
  width?: number;
  height?: number;
  name: string;
  classes?: ComponentClass[];
  description?: string;
  systems?: string[];
}

export interface ModelData {
  components: Component[];
  dataFlows: DataFlow[];
}

/**
 * Class definition for model
 */
export default class Model {
  id?: string;
  data: ModelData;
  createdAt?: number;
  updatedAt?: number;

  // Joined from review table, bit ugly to put here.
  reviewStatus?: string;
  reviewApprovedAt?: Date;
  isTemplate?: boolean;

  //
  shouldReviewActionItems?: boolean;

  constructor(
    public systemId: string | null,
    public version: string,
    public createdBy: string
  ) {
    this.data = { components: [], dataFlows: [] };
  }

  toJSON() {
    return {
      id: this.id,
      systemId: this.systemId,
      version: this.version,
      data: this.data,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      reviewApprovedAt: this.reviewApprovedAt,
      reviewStatus: this.reviewStatus,
      isTemplate: this.isTemplate,
      shouldReviewActionItems: this.shouldReviewActionItems,
    };
  }
}
