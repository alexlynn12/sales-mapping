/* US state code -> display name. Static reference data. */
window.STATE_NAMES={"AL": "Alabama","AK": "Alaska","AZ": "Arizona","AR": "Arkansas","CA": "California","CO": "Colorado","CT": "Connecticut","DE": "Delaware","DC": "District of Columbia","FL": "Florida","GA": "Georgia","HI": "Hawaii","ID": "Idaho","IL": "Illinois","IN": "Indiana","IA": "Iowa","KS": "Kansas","KY": "Kentucky","LA": "Louisiana","ME": "Maine","MD": "Maryland","MA": "Massachusetts","MI": "Michigan","MN": "Minnesota","MS": "Mississippi","MO": "Missouri","MT": "Montana","NE": "Nebraska","NV": "Nevada","NH": "New Hampshire","NJ": "New Jersey","NM": "New Mexico","NY": "New York","NC": "North Carolina","ND": "North Dakota","OH": "Ohio","OK": "Oklahoma","OR": "Oregon","PA": "Pennsylvania","RI": "Rhode Island","SC": "South Carolina","SD": "South Dakota","TN": "Tennessee","TX": "Texas","UT": "Utah","VT": "Vermont","VA": "Virginia","WA": "Washington","WV": "West Virginia","WI": "Wisconsin","WY": "Wyoming"};

/* Approximate state centroids (lat, lon). Used to place the map dot for a
   territory created by splitting an existing one. Static reference data. */
window.STATE_CENTROIDS={"AL":[32.79,-86.83],"AK":[64.07,-152.28],"AZ":[34.27,-111.66],"AR":[34.90,-92.44],
"CA":[37.18,-119.47],"CO":[38.999,-105.55],"CT":[41.62,-72.73],"DE":[38.99,-75.51],"DC":[38.91,-77.01],
"FL":[28.62,-82.50],"GA":[32.65,-83.44],"HI":[20.29,-156.37],"ID":[44.39,-114.66],"IL":[40.06,-89.20],
"IN":[39.91,-86.28],"IA":[42.07,-93.50],"KS":[38.49,-98.38],"KY":[37.53,-85.30],"LA":[31.07,-92.00],
"ME":[45.37,-69.24],"MD":[39.06,-76.80],"MA":[42.26,-71.81],"MI":[44.35,-85.44],"MN":[46.28,-94.31],
"MS":[32.74,-89.67],"MO":[38.36,-92.48],"MT":[47.03,-109.65],"NE":[41.53,-99.79],"NV":[39.36,-116.63],
"NH":[43.68,-71.58],"NJ":[40.19,-74.67],"NM":[34.41,-106.11],"NY":[42.95,-75.53],"NC":[35.54,-79.36],
"ND":[47.45,-100.47],"OH":[40.29,-82.79],"OK":[35.59,-97.49],"OR":[43.94,-120.56],"PA":[40.87,-77.80],
"RI":[41.68,-71.56],"SC":[33.86,-80.90],"SD":[44.44,-100.23],"TN":[35.85,-86.35],"TX":[31.49,-99.34],
"UT":[39.31,-111.67],"VT":[44.07,-72.67],"VA":[37.52,-78.85],"WA":[47.38,-120.45],"WV":[38.64,-80.62],
"WI":[44.62,-89.99],"WY":[42.99,-107.55]};

/* State land area, square miles. Used to keep a territory's `land` figure honest
   when states move between territories. Static reference data. */
window.STATE_LAND={"AL":50645,"AK":570641,"AZ":113594,"AR":52035,"CA":155779,"CO":103642,"CT":4842,
"DE":1949,"DC":61,"FL":53625,"GA":57513,"HI":6423,"ID":82643,"IL":55519,"IN":35826,"IA":55857,
"KS":81759,"KY":39486,"LA":43204,"ME":30843,"MD":9707,"MA":7800,"MI":56539,"MN":79627,"MS":46923,
"MO":68742,"MT":145546,"NE":76824,"NV":109781,"NH":8953,"NJ":7354,"NM":121298,"NY":47126,"NC":48618,
"ND":69001,"OH":40861,"OK":68595,"OR":95988,"PA":44743,"RI":1034,"SC":30061,"SD":75811,"TN":41235,
"TX":261232,"UT":82170,"VT":9217,"VA":39490,"WA":66456,"WV":24038,"WI":54158,"WY":97093};
