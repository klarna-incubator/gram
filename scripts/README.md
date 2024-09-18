# Operation Scripts for Gram

Use these scripts to access the RDS instance that Gram uses.

## Prerequisites

* `go` installed
* `psql` installed
* Your SSH key added to https://scribe.klarna.net/users/ssh_keys/ 
* `aws` cli installed
* Access to relevant AWS accounts hosting the RDS instances

## Running

First launch the bastion via `go run bastion.go`. If successful, this will create a new bastion instance for you and set up an SSH tunnel.

Next run the `./prod-psql.sh` or `./staging-psql.sh`.


