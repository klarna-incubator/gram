import log4js from "log4js";
import { EventEmitter } from "node:events";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import { Link, LinkObjectId, LinkObjectType } from "./Link.js";

export class LinkDataService extends EventEmitter {
  constructor(private dal: DataAccessLayer) {
    super();
    this.pool = dal.pool;
  }

  private pool: GramConnectionPool;

  log = log4js.getLogger("LinkDataService");

  async getById(id: number): Promise<Link | null> {
    const query = `        
        SELECT * FROM links WHERE id = $1
      `;

    const res = await this.pool.query(query, [id]);
    if (res.rows.length === 0) {
      return null;
    }

    return new Link(
      res.rows[0].id,
      res.rows[0].object_type,
      res.rows[0].object_id,
      res.rows[0].label,
      res.rows[0].url,
      res.rows[0].icon,
      res.rows[0].created_by,
      res.rows[0].created_at,
      res.rows[0].updated_at
    );
  }

  async listLinks(
    objectType: LinkObjectType,
    objectId: LinkObjectId
  ): Promise<Link[]> {
    const query = `        
        SELECT * FROM links WHERE object_type = $1 AND object_id = $2
      `;

    const res = await this.pool.query(query, [objectType, objectId]);
    return res.rows.map(
      (row) =>
        new Link(
          row.id,
          row.object_type,
          row.object_id,
          row.label,
          row.url,
          row.icon,
          row.created_by,
          row.created_at,
          row.updated_at
        )
    );
  }

  async insertLink(
    objectType: LinkObjectType,
    objectId: LinkObjectId,
    label: string,
    url: string,
    icon: string,
    createdBy: string
  ): Promise<Link> {
    const query = `        
        INSERT INTO links(object_type, object_id, label, url, icon, created_by) VALUES($1, $2, $3, $4, $5, $6) RETURNING *
      `;

    const res = await this.pool.query(query, [
      objectType,
      objectId,
      label,
      url,
      icon,
      createdBy,
    ]);

    this.notifyUpdatedFor(objectType, objectId);

    const link = new Link(
      res.rows[0].id,
      res.rows[0].object_type,
      res.rows[0].object_id,
      res.rows[0].label,
      res.rows[0].url,
      res.rows[0].icon,
      res.rows[0].created_by,
      res.rows[0].created_at,
      res.rows[0].updated_at
    );

    return link;
  }

  async deleteLink(id: number): Promise<void> {
    const query = `        
        DELETE FROM links WHERE id = $1 RETURNING *
      `;

    const res = await this.pool.query(query, [id]);
    if (res.rows.length > 0) {
      const objectType = res.rows[0].object_type;
      const objectId = res.rows[0].object_id;

      this.notifyUpdatedFor(objectType, objectId);
    }
  }

  async notifyUpdatedFor(objectType: LinkObjectType, objectId: LinkObjectId) {
    let modelId: string | undefined;
    if (objectType === LinkObjectType.Threat) {
      const threat = await this.dal.threatService.getById(objectId);
      if (threat) {
        modelId = threat.modelId;
      }
    } else if (objectType === LinkObjectType.Control) {
      const control = await this.dal.controlService.getById(objectId);
      if (control) {
        modelId = control.modelId;
      }
    } else if (objectType === LinkObjectType.Model) {
      modelId = objectId;
    }

    if (modelId) {
      this.emit("updated-for", { modelId, objectType, objectId });
    }
  }

  async copyLinksBetweenModels(
    srcModelId: string,
    targetModelId: string,
    uuid: Map<string, string>
  ): Promise<void> {
    const queryLinks = `
      INSERT INTO links ( 
        id, object_type, object_id, icon, url, label, created_by, created_at, updated_at
      )
      SELECT id, 
            object_type, 
            $1 as object_id, 
            icon, 
            url, 
            label, 
            created_by, 
            created_at, 
            updated_at              
      FROM links 
      WHERE object_type = $3 AND object_id = $2;
    `;

    const threats = await this.dal.threatService.list(srcModelId);

    for (const threat of threats) {
      if (!uuid.has(threat.id!)) {
        continue;
      }
      try {
        await this.pool.query(queryLinks, [
          uuid.get(threat.id!),
          threat.id,
          LinkObjectType.Threat,
        ]);
      } catch (ex) {
        // Can happen in the odd case where suggestion_id is not found
        this.log.error(
          `Failed to copy links for threat ${threat.id} from model ${srcModelId} to model ${targetModelId}: ${ex}`
        );
        continue;
      }
    }

    const controls = await this.dal.controlService.list(srcModelId);

    for (const control of controls) {
      if (!uuid.has(control.id!)) {
        continue;
      }
      try {
        await this.pool.query(queryLinks, [
          uuid.get(control.id!),
          control.id,
          LinkObjectType.Control,
        ]);
      } catch (ex) {
        // Can happen in the odd case where suggestion_id is not found
        this.log.error(
          `Failed to copy links for control ${control.id} from model ${srcModelId} to model ${targetModelId}: ${ex}`
        );
        continue;
      }
    }

    await this.pool.query(queryLinks, [
      uuid.get(srcModelId),
      srcModelId,
      LinkObjectType.Model,
    ]);
  }
}
