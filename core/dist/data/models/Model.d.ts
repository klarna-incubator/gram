import { ComponentClass } from "../component-classes";
export interface DataFlow {
    id: string;
    endComponent: {
        id: string;
    };
    startComponent: {
        id: string;
    };
    points: number[];
    bidirectional: boolean;
}
type ComponentType = "ee" | "ds" | "proc";
type AuthenticationType = "json-web-token" | "basic-authentication/user-pass" | "one-time-password/single-sign-on" | "iam";
type InjectionMitigationType = "input-sanitation" | "stored-procedures" | "parameterized-queries" | "schema-validation";
type SecretsStorageType = "plaintext" | "git-crypt" | "aws-secrets-manager" | "aws-systems-manager" | "c2c-secrets";
export interface Attributes {
    protocolTLS?: boolean;
    logs?: boolean;
    auditLogs?: boolean;
    accessLogs?: boolean;
    sensitiveDataMaskedInLogs?: boolean;
    logIntegrityProtection?: boolean;
    restrictedLogAccess?: boolean;
    authentication?: boolean | AuthenticationType;
    individualAccounts?: boolean;
    individualRolesPerUser?: boolean;
    inputValidation?: boolean;
    injectionMitigation?: boolean | InjectionMitigationType;
    ddosProtection?: boolean;
    secureSecretsStorage?: boolean | SecretsStorageType;
    limitedTeamAccessToProductionAsset?: boolean;
    encryptionAtRest?: boolean;
    safeCredentialStorage?: boolean;
    backups?: boolean;
}
export interface Component {
    id: string;
    x: number;
    y: number;
    type: ComponentType;
    name: string;
    classes?: ComponentClass[];
    description?: string;
    attributes?: Attributes;
}
export interface ModelData {
    components: Component[];
    dataFlows: DataFlow[];
}
/**
 * Class definition for model
 */
export default class Model {
    systemId: string;
    version: string;
    createdBy: string;
    id?: string;
    data: ModelData;
    createdAt?: number;
    updatedAt?: number;
    reviewStatus?: string;
    reviewApprovedAt?: Date;
    isTemplate?: boolean;
    constructor(systemId: string, version: string, createdBy: string);
    toJSON(): {
        id: string | undefined;
        systemId: string;
        version: string;
        data: ModelData;
        createdBy: string;
        createdAt: number | undefined;
        updatedAt: number | undefined;
        reviewApprovedAt: Date | undefined;
        reviewStatus: string | undefined;
        isTemplate: boolean | undefined;
    };
}
export {};
//# sourceMappingURL=Model.d.ts.map