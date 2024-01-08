import log4js from "log4js";
import { DataAccessLayer } from "../dal.js";
import { GramConnectionPool } from "../postgres.js";
import { Link, LinkObjectId, LinkObjectType } from "./Link.js";
import { EventEmitter } from "node:events";

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

    this.emit("updated-for", { objectType, objectId });

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

      // TODO: need modelId to connect to right websocket.
      this.emit("updated-for", { objectType, objectId });
    }
  }
}
