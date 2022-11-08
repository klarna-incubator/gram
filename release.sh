#!/bin/bash
set -ef -o pipefail 

if [[ -z $1 ]]; then
    echo "Missing version as first argument" 1>&2
    echo "Usage: release.sh <version>" 1>&2
    exit 1
fi

set -o xtrace

git checkout develop
git pull
git checkout -b release/$1

cd app
npm version $1
cd ../api
npm version $1
cd ..

git add app/package*.json
git add api/package*.json
git commit -m "Version $1"

git tag -f $1

git push -u origin release/$1
git push -f -u origin $1

# Undo branch / tag locally via
#   git branch -d release/<version> 
#   git tag -d <version>
# If you already pushed to remote you'll need to delete branch / tag there too