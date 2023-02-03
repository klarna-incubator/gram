/**
 * Class definition for mitigation
 */
export default class Mitigation {
  createdAt: number;
  updatedAt: number;

  constructor(
    public threatId: string,
    public controlId: string,
    public createdBy: string
  ) {
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
  }

  toJSON() {
    return {
      threatId: this.threatId,
      controlId: this.controlId,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
