# README

Taken from
https://github.com/gilbarbara/logos

## How to update

```sh
wget https://github.com/gilbarbara/logos/archive/refs/heads/master.zip
unzip master.zip
rm -r logos
cp -r logos-master/logos .
cp logos-master/logos.json
```

next run the gen-classes-json.js via node

```
node gen-classes-json.js
```

**Important!** Make sure old IDs are still the same. Only new logos should have changed ids.
The above script should print how many old vs new classes were found and output a new file: `new-classes.json`

If the file looks ok

```
mv new-classes.json classes.json
rm master.zip
```

test that it works ok with old models still on your local instance, and commit!
