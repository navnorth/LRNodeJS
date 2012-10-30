#!/bin/bash

# this script will download standards data from Jes & Co and load it into a couchDB, under
# specific categories.  

DB="standards"
CLEANUP=1
DOWNLOADIR=./tmp
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ ! -f $DOWNLOADIR ]; then
	mkdir $DOWNLOADIR
fi

# California Science
curl -L http://asn.jesandco.org/resources/D10000BA_manifest.json -o $DOWNLOADIR/D10000BA_manifest.json
node $DIR/import.js --db=$DB --standard="Science" --category="California" --input=$DOWNLOADIR/D10000BA_manifest.json 

# California History
curl -L http://asn.jesandco.org/resources/D10002A5_manifest.json -o $DOWNLOADIR/D10002A5_manifest.json
node $DIR/import.js --db=$DB --standard="History-Social Science" --category="California" --input=$DOWNLOADIR/D10002A5_manifest.json 

# California Mathematics
curl -L http://asn.jesandco.org/resources/D100011F_manifest.json -o $DOWNLOADIR/D100011F_manifest.json
node $DIR/import.js --db=$DB --standard="Mathematics" --category="California" --input=$DOWNLOADIR/D100011F_manifest.json 

# California CTE
curl -L http://asn.jesandco.org/resources/D1000257_manifest.json -o $DOWNLOADIR/D1000257_manifest.json
node $DIR/import.js --db=$DB --standard="Career and Technical Education" --category="California" --input=$DOWNLOADIR/D1000257_manifest.json 

# Common Core Math
curl -L http://asn.jesandco.org/resources/D10003FB_manifest.json -o $DOWNLOADIR/D10003FB_manifest.json
node $DIR/import.js --db=$DB --standard="Mathematics" --category="Common Core" --input=$DOWNLOADIR/D10003FB_manifest.json 

# Common Core ELA
curl -L http://asn.jesandco.org/resources/D10003FC_manifest.json -o $DOWNLOADIR/D10003FC_manifest.json
node $DIR/import.js --db=$DB --standard="English Language Arts" --category="Common Core" --input=$DOWNLOADIR/D10003FC_manifest.json 

# National Science
curl -L http://asn.jesandco.org/resources/D10001D0_manifest.json -o $DOWNLOADIR/D10001D0_manifest.json
node $DIR/import.js --db=$DB --standard="Science" --category="National" --input=$DOWNLOADIR/D10001D0_manifest.json 

# National Arts
curl -L http://asn.jesandco.org/resources/D10003BC_manifest.json -o $DOWNLOADIR/D10003BC_manifest.json
node $DIR/import.js --db=$DB --standard="Arts" --category="National" --input=$DOWNLOADIR/D10003BC_manifest.json 

# National Math
curl -L http://asn.jesandco.org/resources/D100000A_manifest.json -o $DOWNLOADIR/D100000A_manifest.json
node $DIR/import.js --db=$DB --standard="Mathematics" --category="National" --input=$DOWNLOADIR/D100000A_manifest.json 

# National History
curl -L http://asn.jesandco.org/resources/D10003BD_manifest.json -o $DOWNLOADIR/D10003BD_manifest.json
node $DIR/import.js --db=$DB --standard="History" --category="National" --input=$DOWNLOADIR/D10003BD_manifest.json 

# Other 21st Century Learning
curl -L http://asn.jesandco.org/resources/D10003B9_manifest.json -o $DOWNLOADIR/D10003B9_manifest.json
node $DIR/import.js --db=$DB --standard="Standards for the 21st-Century Learner" --category="Other" --input=$DOWNLOADIR/D10003B9_manifest.json 

# Other Technological Literacy
curl -L http://asn.jesandco.org/resources/D10003E9_manifest.json -o $DOWNLOADIR/D10003E9_manifest.json
node $DIR/import.js --db=$DB --standard="Technological Literacy" --category="Other" --input=$DOWNLOADIR/D10003E9_manifest.json 

if [ "$CLEANUP" = "1" ]; then
	rm -R $DOWNLOADIR
fi
