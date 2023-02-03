/**
 * Class definition for mitigation
 */
export default class Mitigation {
    threatId: string;
    controlId: string;
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    constructor(threatId: string, controlId: string, createdBy: string);
    toJSON(): {
        threatId: string;
        controlId: string;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
    };
}
//# sourceMappingURL=Mitigation.d.ts.map