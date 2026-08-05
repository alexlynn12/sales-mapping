# Land area, sq mi (US Census, land only). AK excluded — no territory covers it.
SA={"AL":50645,"AZ":113594,"AR":52035,"CA":155779,"CO":103642,"CT":4842,"DE":1949,"DC":61,
"FL":53625,"GA":57513,"HI":6423,"ID":82643,"IL":55519,"IN":35826,"IA":55857,"KS":81759,
"KY":39486,"LA":43204,"ME":30843,"MD":9707,"MA":7800,"MI":56539,"MN":79627,"MS":46923,
"MO":68742,"MT":145546,"NE":76824,"NV":109781,"NH":8953,"NJ":7354,"NM":121298,"NY":47126,
"NC":48618,"ND":69001,"OH":40861,"OK":68595,"OR":95988,"PA":44743,"RI":1034,"SC":30061,
"SD":75811,"TN":41235,"TX":261232,"UT":82170,"VT":9217,"VA":39490,"WA":66456,"WV":24038,
"WI":54158,"WY":97093}
from states import TS
_cnt={}
for t,sts in TS.items():
    for s in sts: _cnt[s]=_cnt.get(s,0)+1
# a territory's footprint = its share of each state it covers
AREA={t: sum(SA[s]/_cnt[s] for s in sts) for t,sts in TS.items()}
TOTAL=sum(AREA.values())
if __name__=='__main__':
    print(f"total covered land: {TOTAL:,.0f} sq mi")
    for t,a in sorted(AREA.items(), key=lambda kv:-kv[1])[:8]: print(f"  {t:26s} {a:>10,.0f}")
    from plans import M7
    for a,ts in M7.items():
        print(f"{a:16s} {sum(AREA[t] for t in ts):>10,.0f} sq mi  ({sum(AREA[t] for t in ts)/TOTAL*100:4.1f}%)  {len(ts)} reps")
