"""US zip code reference table -> assets/zips.json

Source: GeoNames postal code export (download.geonames.org/export/zip/US.zip),
CC BY 4.0 — https://www.geonames.org. Not committed; regenerate from a fresh
download when the source updates.

    curl -sSL -o /tmp/us_zips.zip http://download.geonames.org/export/zip/US.zip
    unzip -o /tmp/us_zips.zip -d /tmp/us_zips
    python3 tools/reference/build_zips.py /tmp/us_zips/US.txt assets/zips.json
"""
import csv
import json
import sys

def build(src_path, out_path):
    rows = []
    seen = set()
    with open(src_path, encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        for parts in reader:
            if len(parts) < 11:
                continue
            zip_, city, state, county = parts[1], parts[2], parts[4], parts[5]
            lat, lon = parts[9], parts[10]
            if not zip_ or not state or not lat or not lon:
                continue
            if zip_ in seen:
                continue
            seen.add(zip_)
            rows.append([zip_, city, state, county, round(float(lat), 4), round(float(lon), 4)])
    rows.sort(key=lambda r: r[0])
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(rows, f, separators=(',', ':'), ensure_ascii=False)
    print(f'{len(rows)} zips -> {out_path}')

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print('usage: build_zips.py <geonames US.txt> <out zips.json>')
        sys.exit(1)
    build(sys.argv[1], sys.argv[2])
