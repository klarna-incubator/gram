# Backups

To protect against potential data loss, we keep backups in the form of snapshots for the Postgres database used by Gram.
This document describes the process for verifying the backup.

## Verifying the RDS Backup

1. Log in to the production AWS account via SSO

2. Go to RDS, then Databases.

3. Select the database you want to verify, then select "Restore to point in time" in the "Actions" menu. This will let you create a new RDS cluster and instance using the snapshot, the currently running instance will not be affected.

   In the options for the instance:

   - Add the "postgres_allow_office" security group, to enable connectivity from the VPN.
   - Tick `IAM database authentication`

4. Wait for the instance to be provisioned.

### Testing the Backup

Copy the [IAM Auth script](../api/scripts/prod-psql.sh) and modify it to connect to your new backup instance.

Here are some queries specifically for Gram that you can use to check the data looks ok.

The following queries you can use to check recent activity. Models and user activity should be relatively recent,
depending on your picked snapshot.

```sql
select system_id, version, created_at from models order by created_at DESC;
select * from user_activity ORDER BY created_at DESC;
```

Check earliest models, these may differ since the time of writing, but here are what they currently look like:

```sql
gram=> select system_id, version, created_at FROM models ORDER BY created_at ASC LIMIT 10;
 system_id | version |       created_at
-----------+---------+------------------------
 477       | 1.0     | 2019-06-10 10:31:02+00
 201       | 1.0     | 2019-06-18 12:27:25+00
 432       | 1.0     | 2019-06-28 09:45:08+00
 278       | 1.0     | 2019-07-12 08:46:54+00
 1228022   | 1.0     | 2019-07-25 14:24:04+00
 1301059   | 1.0     | 2019-07-25 14:44:55+00
 993570    | 1.0     | 2019-08-15 13:46:10+00
 1212411   | 1.0     | 2019-08-15 13:52:08+00
 1448173   | 1.0     | 2019-08-20 08:18:55+00
 29452     | 1.0     | 2019-08-22 08:59:57+00
```

Should be comparable to what is on the dashboard for up-to-date systems:

```sql
SELECT
    COUNT(DISTINCT system_id)
FROM models
WHERE
    created_at > current_timestamp - interval '1 year' OR updated_at > current_timestamp - interval '1 year'
```

Basic counts:

```sql
select count(*) from models;
select count(*) from threats;
select count(*) from controls;
```

Also useful to check roles and tables (may differ in the future):

```
gram => \du
                                                                 List of roles
      Role name      |                         Attributes                         |                          Member of
---------------------+------------------------------------------------------------+-------------------------------------------------------------
 GramKPIExporterRole |                                                            | {rds_iam}
 gram                | Create role, Create DB                                    +| {rds_superuser}
                     | Password valid until infinity                              |
 gram.IdP_admin      |                                                            | {rds_iam}
 rds_ad              | Cannot login                                               | {}
 rds_iam             | Cannot login                                               | {}
 rds_password        | Cannot login                                               | {}
 rds_replication     | Cannot login                                               | {}
 rds_superuser       | Cannot login                                               | {pg_monitor,pg_signal_backend,rds_replication,rds_password}
 rdsadmin            | Superuser, Create role, Create DB, Replication, Bypass RLS+| {}
                     | Password valid until infinity                              |
 rdsrepladmin        | No inheritance, Cannot login, Replication                  | {}
 readonly            | Cannot login                                               | {}

gram=> \dt
           List of relations
 Schema |     Name      | Type  | Owner
--------+---------------+-------+-------
 public | controls      | table | gram
 public | models        | table | gram
 public | threats       | table | gram
 public | user_activity | table | gram
```

### Cleanup

Finally, delete the cluster. To do so, you'll first need to delete the database instance, then the cluster.

_Read carefully so that you don't delete the wrong database_. Skip creating the final snapshot.
