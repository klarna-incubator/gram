# README

Taken from
https://github.com/gilbarbara/logos

## How to update

(This process is very awkard, I apologize. Automating it is possible but haven't had the time)

Fetch the latest logos from the `gilbarbara/logos` repo
```sh
wget https://github.com/gilbarbara/logos/archive/refs/heads/master.zip
unzip master.zip
rm -r src/logos
cp -r logos-main/logos src/
cp logos-main/logos.json src/
```

Next, copy the hardcoded classes list from [./src/classes.ts](./src/classes.ts) into a `classes.json` file inside src/ (yes this is awkward to do. I use regex to format it).

Then run the `gen-classes-json.js` via node. This will generate a `new-classes.json` file based on what's in the logos.json and the pre-existing `classes.json`.
```
node gen-classes-json.js
```

**Important!** Make sure old IDs are still the same. Only new logos should have changed ids.
The above script should print how many old vs new classes were found and output a new file: `new-classes.json`

If the file looks ok, use the `new-classes.json` file to write a new `classes.ts` file.

remove any leftover files (e.g. master.zip), test that it works ok with old models still on your local instance, and commit!

