"""Area leaders, their home bases, and the metro pairs that must not be split.

The real table for a given book of business is private — it names roles, locations
and, in practice, people. Keep it in `leaders_private.py` next to this file; that
filename is gitignored. If it is present it wins; otherwise the illustrative table
below is used, so the importer runs out of the box on a fresh clone.

Each LEADERS row is:
    (role, area, home label, lat, lon, [core territories that must sit in that area])

`core` is the hard constraint — those territories cannot be drawn into another area
without the app flagging it. VACATED is an optional single row for a seat that is
open, so the area still has a home base to balance around.
"""

# Illustrative only — replace via leaders_private.py
LEADERS = [
    ("AVP", "Area 1", "East hub",     40.80,  -74.20, []),
    ("AVP", "Area 2", "Midwest hub",  39.96,  -83.00, []),
    ("AVP", "Area 3", "Gulf hub",     30.45,  -91.19, []),
    ("ASD", "Area 4", "Mountain hub", 43.62, -116.20, []),
    ("ASD", "Area 5", "Pacific hub",  33.16, -117.35, []),
]

VACATED = ("AVP", "Area 6", "open seat", 36.16, -86.78, [])

# Territories that are two halves of one metro and must never land in different
# areas. Structural, not confidential — safe to keep in the repo.
COLOCATE = [
    ("Denver Direct", "Denver Distributor"),
    ("Tampa North", "Tampa South"),
    ("Orlando North", "Orlando South"),
    ("Atlanta North", "Atlanta South"),
    ("Bay Area", "Sacramento"),
]

try:  # a real table, if one is present locally
    from leaders_private import LEADERS, VACATED  # type: ignore  # noqa: F401,F811
except ImportError:
    pass
