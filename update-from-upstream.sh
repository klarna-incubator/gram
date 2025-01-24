#!/bin/sh
set -e

git fetch
git fetch github # assuming here that github origin is the OSS repo

git checkout develop
git pull

# create branch from upstream tag + date
tag=$(git describe --tags --abbrev=0 github/main)
branch="github-$tag-$(date +%Y%m%d)"
git checkout -b $branch $tag

# Pull in changes from upstream
git pull github main

# Push branch to stash
git push