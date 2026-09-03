"""Seed the database with initial destinations and sample vendors for the hackathon demo."""

import asyncio
from datetime import date

from sqlalchemy import select, update

from app.db.base import Base
from app.db.session import async_session_factory, engine
# Import every mapped model before configuring relationships or creating the
# schema. Destination refers to Trip and TrailReport by string name.
from app.models.advisory import Advisory  # noqa: F401
from app.models.destination import Destination
from app.models.emergency_contact import EmergencyContact  # noqa: F401
from app.models.sos_event import SOSEvent  # noqa: F401
from app.models.trail_report import TrailReport  # noqa: F401
from app.models.trip import Trip  # noqa: F401
from app.models.trip_place import TripPlace  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.vendor import Vendor
from app.models.place import Place
from app.models.product import Product
from app.models.order import Order, OrderItem  # noqa: F401

DESTINATIONS = [
    {
        "name": "Hunza",
        "latitude": 36.3167,
        "longitude": 74.8833,
        "description": (
            "Hunza Valley, nestled in the Gilgit-Baltistan region, is famous for "
            "its stunning mountain scenery, ancient forts, and the welcoming hospitality "
            "of its people. Key attractions include Baltit Fort, Altit Fort, and Attabad Lake."
        ),
        "known_hazards": (
            "Karakoram Highway may face landslides during heavy rain. "
            "Babusar Pass (if approaching from the south) closes in heavy snow from "
            "late November to April. Altitude sickness possible above 2500 m. "
            "Limited cellular coverage beyond Karimabad."
        ),
    },
    {
        "name": "Naran",
        "latitude": 34.8983,
        "longitude": 73.6511,
        "description": (
            "Naran is a town in the Kaghan Valley, a popular base for visiting "
            "Lake Saif-ul-Malooq, Lulusar Lake, and the Babusar Pass. "
            "It is one of the most visited tourist destinations in Pakistan."
        ),
        "known_hazards": (
            "Babusar Pass closes in heavy snow from late November to April/May. "
            "Flash flooding possible in Kaghan Valley during monsoon (July-August). "
            "Road from Balakot to Naran is narrow and winding — allow extra travel time. "
            "Lake Saif-ul-Malooq requires a jeep ride on rough terrain."
        ),
    },
    {
        "name": "Skardu",
        "latitude": 35.2975,
        "longitude": 75.6333,
        "description": (
            "Skardu is the gateway to some of the world's highest peaks, including K2. "
            "Highlights include Shangrila Resort (Lower Kachura Lake), Upper Kachura Lake, "
            "Deosai National Park, and the cold desert of Katpana."
        ),
        "known_hazards": (
            "Skardu Road (from Gilgit or Islamabad) is prone to landslides. "
            "Flight cancellations to Skardu Airport are frequent due to weather. "
            "Deosai Plateau (4100 m) — severe altitude sickness risk, carry Diamox. "
            "Hypothermia risk even in summer at high-altitude campsites. "
            "Very limited medical facilities — carry a comprehensive first-aid kit."
        ),
    },
    # A broad, curated Northern Pakistan catalogue. Coordinates identify the
    # town/valley centre; travellers should still confirm route access locally.
    {"name": "Kaghan", "latitude": 34.793, "longitude": 73.521, "description": "Kaghan Valley base for river, forest and alpine-lake excursions.", "known_hazards": "Monsoon rain can affect roads and riverbanks; check local road conditions."},
    {"name": "Shogran", "latitude": 34.627, "longitude": 73.496, "description": "Forest hill station above Kaghan Valley and gateway to Siri Paye.", "known_hazards": "Access roads are steep and can be slippery in rain or snow."},
    {"name": "Balakot", "latitude": 34.549, "longitude": 73.352, "description": "Gateway town for the Kaghan Valley on the Kunhar River.", "known_hazards": "Riverbanks and mountain roads require caution during heavy rain."},
    {"name": "Swat", "latitude": 35.222, "longitude": 72.425, "description": "Swat Valley hub for heritage, riverside and mountain travel.", "known_hazards": "Check weather, road notices and local guidance before higher-valley travel."},
    {"name": "Kalam", "latitude": 35.490, "longitude": 72.584, "description": "Upper Swat base for lakes, meadows and mountain drives.", "known_hazards": "Roads can be rough and may close after snowfall or rain."},
    {"name": "Malam Jabba", "latitude": 34.800, "longitude": 72.573, "description": "Mountain resort area known for skiing and chairlift access.", "known_hazards": "Cold-weather gear and current slope conditions are essential in winter."},
    {"name": "Chitral", "latitude": 35.851, "longitude": 71.786, "description": "Chitral town, a hub for Chitral Valley, forts and nearby mountain valleys.", "known_hazards": "Long mountain journeys and seasonal pass closures require advance planning."},
    {"name": "Kalash Valleys", "latitude": 35.669, "longitude": 71.726, "description": "Bumburet, Rumbur and Birir valleys with distinctive cultural heritage.", "known_hazards": "Respect local customs; roads may be narrow and weather-sensitive."},
    {"name": "Kumrat", "latitude": 35.564, "longitude": 72.188, "description": "Upper Dir valley known for forests, river scenery and meadows.", "known_hazards": "Jeep tracks, river crossings and rain can create difficult conditions."},
    {"name": "Neelum Valley", "latitude": 34.585, "longitude": 73.907, "description": "Azad Kashmir valley of riverside villages, lakes and high mountain viewpoints.", "known_hazards": "Mountain roads can be affected by rain, landslides and winter weather."},
    {"name": "Muzaffarabad", "latitude": 34.370, "longitude": 73.471, "description": "Capital hub for Azad Kashmir with access to Neelum and Jhelum valleys.", "known_hazards": "Observe local route advisories, particularly in rain."},
    {"name": "Gilgit", "latitude": 35.920, "longitude": 74.309, "description": "Regional hub on the Karakoram Highway with heritage sites and valley access.", "known_hazards": "Highway disruptions and changing mountain weather can affect travel."},
    {"name": "Naltar", "latitude": 36.145, "longitude": 74.194, "description": "Alpine valley near Gilgit known for forests, lakes and skiing.", "known_hazards": "A high-clearance vehicle may be needed; snow and cold are common in season."},
    {"name": "Nagar", "latitude": 36.089, "longitude": 74.576, "description": "Karakoram valley with Hoper Glacier, views of Rakaposhi and trekking terrain.", "known_hazards": "Glacier viewpoints and mountain tracks need local guidance and suitable footwear."},
    {"name": "Astore", "latitude": 35.367, "longitude": 74.850, "description": "Pastoral valley and access route to Rama Lake and Deosai.", "known_hazards": "High-altitude weather changes rapidly and some routes are seasonal."},
    {"name": "Fairy Meadows", "latitude": 35.421, "longitude": 74.596, "description": "Nanga Parbat viewpoint reached via a jeep road and walking trail.", "known_hazards": "Jeep access and the walk require fitness; confirm conditions with local operators."},
    {"name": "Shigar", "latitude": 35.422, "longitude": 75.739, "description": "Baltistan valley and cultural gateway towards the Karakoram trekking region.", "known_hazards": "Remote routes need supplies, reliable transport and local guidance."},
    {"name": "Khaplu", "latitude": 35.162, "longitude": 76.334, "description": "Ghanche valley centre with heritage, orchards and Hushe Valley access.", "known_hazards": "Remote mountain travel and changing weather require preparation."},
    {"name": "Deosai", "latitude": 35.030, "longitude": 75.450, "description": "High-altitude alpine plateau and national park, approached seasonally from Skardu or Astore.", "known_hazards": "Very high elevation and cold exposure; seasonal road access only."},
    {"name": "Phander", "latitude": 36.226, "longitude": 72.982, "description": "Ghizer Valley village known for lake, river and meadow landscapes.", "known_hazards": "Remote roads and sparse services make advance preparation important."},
    {"name": "Shandur", "latitude": 36.060, "longitude": 72.500, "description": "High mountain pass and polo-ground area between Chitral and Ghizer.", "known_hazards": "High altitude, extreme weather and seasonal access require a confirmed plan."},
    {"name": "Gojal", "latitude": 36.742, "longitude": 74.857, "description": "Upper Hunza region of high mountain villages, lakes and Karakoram Highway viewpoints.", "known_hazards": "High-altitude weather and long travel distances require supplies and current road information."},
    {"name": "Passu", "latitude": 36.468, "longitude": 74.891, "description": "Upper Hunza village known for the Passu Cones, glacier and suspension bridge.", "known_hazards": "Roadside viewpoints and glacier terrain require caution; confirm local conditions."},
    {"name": "Shimshal", "latitude": 36.475, "longitude": 75.345, "description": "Remote Upper Hunza valley with trekking and high-mountain landscapes.", "known_hazards": "Remote access, sparse services and rapidly changing conditions require local planning."},
    {"name": "Gupis", "latitude": 36.216, "longitude": 73.404, "description": "Ghizer district base for valleys, lakes and road travel toward Shandur.", "known_hazards": "Remote roads and seasonal weather can affect travel times."},
    {"name": "Mastuj", "latitude": 36.284, "longitude": 72.529, "description": "Upper Chitral settlement on the route to Shandur Pass.", "known_hazards": "High-altitude, remote road travel needs a confirmed weather and fuel plan."},
    {"name": "Leepa Valley", "latitude": 34.525, "longitude": 73.895, "description": "Azad Kashmir valley with forested slopes, villages and seasonal scenery.", "known_hazards": "Mountain roads can be weather-sensitive; verify local access before departure."},
    {"name": "Toli Pir", "latitude": 33.844, "longitude": 74.152, "description": "High meadow ridge near Rawalakot with panoramic views.", "known_hazards": "Fog, rain and unpaved mountain roads may affect access."},
    {"name": "Banjosa Lake", "latitude": 33.855, "longitude": 73.890, "description": "Forest lake near Rawalakot popular for family visits and walks.", "known_hazards": "Use caution on wet mountain roads and around water."},
]

VENDORS = {
    "Hunza": [
        {
            "name": "Hunza Adventure Gear Rentals",
            "type": "gear_rental",
            "contact_phone": "+92-5815-123456",
            "description": "Trekking poles, sleeping bags, camping tents, and cold-weather jackets for rent in Karimabad.",
            "latitude": 36.3140,
            "longitude": 74.8800,
        },
        {
            "name": "Karakoram Guides Hunza",
            "type": "guide",
            "contact_phone": "+92-5815-654321",
            "description": "Experienced local guides for Rakaposhi base camp, Ultar Glacier, and Patundas trek.",
            "latitude": 36.3200,
            "longitude": 74.8900,
        },
    ],
    "Naran": [
        {
            "name": "Kaghan Outdoors",
            "type": "gear_rental",
            "contact_phone": "+92-997-111222",
            "description": "Jeep rental, camping gear, and warm clothing available near Naran bazaar.",
            "latitude": 34.9000,
            "longitude": 73.6500,
        },
        {
            "name": "Saif-ul-Malooq Tour Guides",
            "type": "guide",
            "contact_phone": "+92-997-333444",
            "description": "Local guides for Lake Saif-ul-Malooq, Lulusar Lake, and Babusar Pass excursions.",
            "latitude": 34.9010,
            "longitude": 73.6520,
        },
    ],
    "Skardu": [
        {
            "name": "Baltoro Outfitters",
            "type": "gear_rental",
            "contact_phone": "+92-5832-555666",
            "description": "High-altitude trekking equipment, oxygen cylinders, and mountaineering gear.",
            "latitude": 35.2980,
            "longitude": 75.6340,
        },
        {
            "name": "K2 Base Camp Guides Skardu",
            "type": "guide",
            "contact_phone": "+92-5832-777888",
            "description": "Certified mountain guides for K2 base camp trek, Deosai plateau, and Nangma Valley.",
            "latitude": 35.3000,
            "longitude": 75.6350,
        },
    ],
}

# Curated "famous areas" catalogue: every destination gets the stops travellers
# actually ask for, so the planner can offer a real itinerary instead of a single
# placeholder. Each entry is (name, description, activity_tags, popularity_rank)
# where rank 1 is the most-visited attraction of that destination — the AI
# top-picks layer uses the rank as grounding.
#
# `image_url` is left empty on purpose; fill in licensed (or owned) image URLs
# before a public launch.
#
# LEGACY_PLACE_RENAMES maps the coarse placeholder names an earlier seed created
# onto their successor in this catalogue, so re-seeding an existing database
# merges those rows instead of leaving near-duplicates ("Babusar Pass" next to
# "Babusar Top") in the planner's list.
LEGACY_PLACE_RENAMES: dict[str, dict[str, str]] = {
    "Deosai": {"Deosai National Park": "Deosai Plains"},
    "Fairy Meadows": {"Nanga Parbat Viewpoint": "Fairy Meadows"},
    "Khaplu": {"Khaplu Fort": "Khaplu Palace"},
    "Kumrat": {"Kumrat Forest and Panjkora River": "Kumrat Forest"},
    "Malam Jabba": {"Malam Jabba Resort": "Malam Jabba Ski Resort"},
    "Naltar": {"Naltar Lakes": "Satrangi Lake"},
    "Naran": {"Babusar Pass": "Babusar Top"},
    "Passu": {"Passu Glacier and Suspension Bridge": "Passu Glacier"},
    "Swat": {"Mingora and Swat Museum": "Swat Museum"},
}


async def _merge_legacy_places(db, dest_map: dict[str, int]) -> None:
    """Fold placeholder place rows from earlier seeds into their successor.

    When the successor row does not exist yet the legacy row is simply renamed,
    which keeps its id and therefore any checklist entry or trail report already
    pointing at it. When both rows exist the references are moved across and the
    legacy row is deleted.
    """
    for dest_name, renames in LEGACY_PLACE_RENAMES.items():
        dest_id = dest_map.get(dest_name)
        if dest_id is None:
            continue
        for legacy_name, canonical_name in renames.items():
            legacy = await db.scalar(
                select(Place).where(Place.destination_id == dest_id, Place.name == legacy_name)
            )
            if legacy is None:
                continue
            canonical = await db.scalar(
                select(Place).where(Place.destination_id == dest_id, Place.name == canonical_name)
            )
            if canonical is None:
                legacy.name = canonical_name
                print(f"  ~ renamed {dest_name}/{legacy_name} -> {canonical_name}")
                continue

            await db.execute(
                update(TrailReport)
                .where(TrailReport.place_id == legacy.id)
                .values(place_id=canonical.id)
            )
            # trip_places is unique on (trip_id, place_id), so a trip holding both
            # rows would collide on update — drop the legacy duplicate instead.
            trips_with_canonical = {
                trip_id
                for (trip_id,) in (
                    await db.execute(
                        select(TripPlace.trip_id).where(TripPlace.place_id == canonical.id)
                    )
                ).all()
            }
            for row in (
                await db.execute(select(TripPlace).where(TripPlace.place_id == legacy.id))
            ).scalars():
                if row.trip_id in trips_with_canonical:
                    await db.delete(row)
                else:
                    row.place_id = canonical.id
            await db.flush()
            await db.delete(legacy)
            print(f"  ~ merged {dest_name}/{legacy_name} into {canonical_name}")
    await db.flush()


FAMOUS_PLACES: dict[str, list[tuple[str, str, list[str], int]]] = {
    "Naran": [
        ("Lake Saif-ul-Malook", "Pakistan's most visited alpine lake, a jeep ride above Naran below Malika Parbat.", ["lake", "jeep", "walking", "photography"], 1),
        ("Lulusar Lake", "Roadside alpine lake on the Babusar corridor and the source of the Kunhar River.", ["lake", "road-trip", "photography"], 2),
        ("Babusar Top", "Seasonal 4,173 m pass linking Kaghan Valley to the Karakoram Highway.", ["road-trip", "viewpoint", "high-altitude"], 3),
        ("Lalazar Meadows", "Pine-fringed meadow plateau above Battakundi with Malika Parbat views.", ["meadow", "jeep", "camping", "photography"], 4),
        ("Ansoo Lake", "Tear-shaped high-altitude lake reached by a demanding full-day trek.", ["trekking", "lake", "high-altitude"], 5),
        ("Dudipatsar Lake", "Remote turquoise lake in Lulusar-Dudipatsar National Park, trekked from Besal.", ["trekking", "lake", "high-altitude", "camping"], 6),
        ("Battakundi", "Quiet riverside village between Naran and Lalazar, popular for overnight stays.", ["river", "camping", "walking"], 7),
        ("Jalkhad", "High meadow settlement on the Naran-Babusar road, a common tea and photo stop.", ["meadow", "road-trip", "photography"], 8),
        ("Besal", "Trailhead camp for Dudipatsar, just short of Babusar Top.", ["camping", "trekking", "high-altitude"], 9),
        ("Saral Lake", "Meadow-ringed lake trekked from the Kaghan side, far quieter than Saif-ul-Malook.", ["trekking", "lake", "meadow"], 10),
        ("Noori Top", "High ridge crossing between Kaghan and Neelum with wide valley views.", ["viewpoint", "jeep", "high-altitude"], 11),
        ("Naran Bazaar", "Main street for jeep hire, guides, food and last-minute supplies.", ["walking", "shopping"], 12),
    ],
    "Kaghan": [
        ("Shogran", "Forested plateau above the valley floor and the gateway to Siri Paye.", ["forest", "meadow", "walking"], 1),
        ("Siri Paye Meadows", "Twin meadow and pond reached by jeep from Shogran, famous for its skyline.", ["meadow", "jeep", "photography"], 2),
        ("Sharan Forest", "Dense old-growth forest and camping area above Paras.", ["forest", "camping", "walking"], 3),
        ("Manoor Valley", "Side valley of trout streams and terraced villages, still lightly visited.", ["river", "walking", "camping"], 4),
        ("Kunhar River", "The river that defines the valley — trout fishing and riverside stops throughout.", ["river", "photography", "road-trip"], 5),
        ("Kaghan Village", "Valley village between Balakot and Naran, a useful mid-route halt.", ["walking", "road-trip"], 6),
    ],
    "Shogran": [
        ("Siri Paye Meadows", "Jeep track from Shogran to open meadows with a seasonal pond and peak views.", ["meadow", "jeep", "photography"], 1),
        ("Makra Peak Trek", "Day hike from Siri Paye to a 3,885 m spider-shaped summit ridge.", ["trekking", "high-altitude", "viewpoint"], 2),
        ("Shogran Pine Forest", "Gentle forest walks straight from the hotel strip.", ["forest", "walking"], 3),
        ("Payee Meadows", "Upper meadow beyond Siri Paye for travellers who want to keep climbing.", ["meadow", "walking", "camping"], 4),
    ],
    "Balakot": [
        ("Kiwai Waterfall", "Roadside waterfall on the Balakot-Shogran road, the valley's classic first stop.", ["waterfall", "road-trip", "photography"], 1),
        ("Kunhar River Viewpoint", "Riverside promenade and bridges through Balakot town.", ["river", "walking", "photography"], 2),
        ("Sharan Forest", "Forest reserve and camping ground reached by jeep from Paras.", ["forest", "camping", "jeep"], 3),
        ("Balakot Bazaar", "Provisioning point for the whole Kaghan Valley run.", ["walking", "shopping"], 4),
    ],
    "Hunza": [
        ("Baltit Fort", "Restored 700-year-old fort above Karimabad, a landmark conservation project.", ["heritage", "walking", "photography"], 1),
        ("Attabad Lake", "Turquoise landslide lake on the Karakoram Highway, with boating and lakeside cafes.", ["lake", "boating", "road-trip"], 2),
        ("Eagle's Nest Duikar", "Sunrise and sunset viewpoint over the whole Hunza Valley.", ["viewpoint", "photography", "road-trip"], 3),
        ("Altit Fort", "The valley's oldest fort, with the restored Royal Garden beside it.", ["heritage", "walking"], 4),
        ("Rakaposhi View Point", "Roadside terrace at Ghulmat facing the 7,788 m north face.", ["viewpoint", "road-trip", "photography"], 5),
        ("Karimabad Bazaar", "Craft, gem and dried-fruit shops below Baltit Fort.", ["walking", "shopping", "culture"], 6),
        ("Ganish Village", "Ancient KKH-side settlement of watchtowers and carved wooden mosques.", ["heritage", "culture", "walking"], 7),
        ("Sacred Rocks of Hunza", "Haldeikish petroglyph panels recording two millennia of Silk Road traffic.", ["heritage", "walking", "photography"], 8),
        ("Ultar Meadow Trek", "Steep half-day climb from Karimabad to a glacier-side shepherd meadow.", ["trekking", "glacier", "high-altitude"], 9),
        ("Hunza Apricot Orchards", "Seasonal blossom and harvest walks through the terraced orchards.", ["walking", "photography", "culture"], 10),
        ("Khunjerab Pass", "4,693 m Pakistan-China border pass, a long but standard day trip from Karimabad.", ["road-trip", "high-altitude", "viewpoint", "wildlife"], 11),
    ],
    "Gojal": [
        ("Khunjerab Pass", "4,693 m Pakistan-China border pass inside Khunjerab National Park.", ["road-trip", "high-altitude", "viewpoint", "wildlife"], 1),
        ("Borith Lake", "Brackish lake above Gulmit, a migratory bird stop below Ghulkin Glacier.", ["lake", "walking", "wildlife"], 2),
        ("Hussaini Suspension Bridge", "Much-photographed plank bridge across the Hunza River.", ["walking", "photography"], 3),
        ("Gulmit", "Upper Hunza village with a heritage museum, old houses and glacier views.", ["culture", "heritage", "walking"], 4),
        ("Chapursan Valley", "Remote valley toward the Afghan Wakhan, ending at the Baba Ghundi shrine.", ["road-trip", "culture", "high-altitude"], 5),
        ("Batura Glacier", "One of the world's longest non-polar glaciers, viewed from the Passu side.", ["glacier", "trekking", "photography"], 6),
        ("Sost", "Last town before the border and the dry port for Khunjerab traffic.", ["road-trip", "walking"], 7),
    ],
    "Passu": [
        ("Passu Cones", "The serrated Tupopdan skyline, Pakistan's most recognisable mountain silhouette.", ["viewpoint", "photography", "road-trip"], 1),
        ("Passu Glacier", "Short walk from the village to the glacier snout and moraine.", ["glacier", "walking", "photography"], 2),
        ("Hussaini Suspension Bridge", "Plank-and-cable crossing a short drive down-valley.", ["walking", "photography"], 3),
        ("Yunz Valley Viewpoint", "Short uphill trail for a full-frame view of the cones and river bend.", ["viewpoint", "trekking"], 4),
    ],
    "Shimshal": [
        ("Shimshal Valley", "High Wakhi valley at 3,100 m, reached by a dramatic cliff-side jeep road.", ["road-trip", "culture", "high-altitude"], 1),
        ("Shimshal Pass", "Multi-day trek to the Pamir summer pastures used by Shimshali herders.", ["trekking", "camping", "high-altitude"], 2),
        ("Shimshal Lake", "Glacial lake on the Pamir plateau above the village.", ["lake", "trekking", "high-altitude"], 3),
        ("Shimshal Road", "The road itself — a hand-built track carved above the Shimshal River gorge.", ["road-trip", "photography"], 4),
    ],
    "Nagar": [
        ("Hoper Glacier", "Amphitheatre of ice below Hoper village, viewable from the roadhead.", ["glacier", "walking", "photography"], 1),
        ("Rakaposhi Base Camp Trek", "Two-day trek from Minapin to a meadow camp beneath Rakaposhi and Diran.", ["trekking", "camping", "high-altitude"], 2),
        ("Rush Lake", "One of the highest alpine lakes in the world, trekked above Hoper.", ["trekking", "lake", "high-altitude"], 3),
        ("Miar Glacier", "Glacier basin beside Hoper, usually combined with the Rush Lake route.", ["glacier", "trekking"], 4),
        ("Hoper Valley", "Terraced village and orchards facing the glacier.", ["culture", "walking", "photography"], 5),
    ],
    "Gilgit": [
        ("Kargah Buddha", "Seventh-century Buddha carved into a cliff face west of the city.", ["heritage", "walking", "photography"], 1),
        ("Junction of Three Mountain Ranges", "Marked viewpoint near Jaglot where the Karakoram, Himalaya and Hindu Kush meet.", ["viewpoint", "road-trip", "photography"], 2),
        ("Danyor Rock Inscriptions", "Sacred-rock carvings and inscriptions beside the old Danyor road.", ["heritage", "walking"], 3),
        ("Chinar Bagh", "Riverside park and open ground in the middle of Gilgit.", ["walking", "photography"], 4),
        ("Gilgit Bazaar", "Regional trading hub for gear, gems and onward transport.", ["walking", "shopping"], 5),
    ],
    "Naltar": [
        ("Satrangi Lake", "The 'rainbow lake' — Naltar's signature stop, reached by jeep past Bodat.", ["lake", "jeep", "photography"], 1),
        ("Naltar Blue Lake", "Deep blue glacial lake ringed by pine forest.", ["lake", "walking", "photography"], 2),
        ("Naltar Ski Slopes", "Air-force-run ski area and chairlift, in season from January.", ["skiing", "chairlift", "high-altitude"], 3),
        ("Naltar Pine Forest", "Jeep track and forest walks between Nomal and the upper valley.", ["forest", "jeep", "walking"], 4),
        ("Dhudia Lake", "Milky-green lake in the upper Naltar chain.", ["lake", "trekking"], 5),
    ],
    "Skardu": [
        ("Shangrila Lower Kachura Lake", "Resort lake with the well-known aircraft-fuselage restaurant.", ["lake", "boating", "walking"], 1),
        ("Upper Kachura Lake", "Clear, deep lake a short walk beyond Shangrila.", ["lake", "walking", "photography"], 2),
        ("Deosai National Park", "The 4,100 m 'Land of Giants' plateau, open roughly June to September.", ["high-altitude", "wildlife", "camping", "road-trip"], 3),
        ("Katpana Cold Desert", "High-altitude sand dunes beside the Indus, best at sunset.", ["desert", "walking", "photography"], 4),
        ("Kharpocho Fort", "Hilltop fort above Skardu with a panorama over the Indus bend.", ["heritage", "trekking", "viewpoint"], 5),
        ("Satpara Lake", "Reservoir on the road to Deosai, with island views.", ["lake", "road-trip", "photography"], 6),
        ("Manthokha Waterfall", "Tall waterfall and picnic area in Kharmang, a day trip from Skardu.", ["waterfall", "road-trip", "walking"], 7),
        ("Marsur Rock", "Cliff-edge slab often called Pakistan's Trolltunga, a steep half-day hike.", ["trekking", "viewpoint", "photography"], 8),
        ("Blind Lake", "Quiet lake near Kachura, popular for early-morning reflections.", ["lake", "walking", "photography"], 9),
        ("Sadpara Buddha", "Rock-carved Buddha panel on the old Satpara route.", ["heritage", "walking"], 10),
    ],
    "Shigar": [
        ("Shigar Fort", "Seventeenth-century Raja's fort restored as a heritage hotel and museum.", ["heritage", "walking", "culture"], 1),
        ("Blind Lake Shigar", "Willow-lined lake on the valley floor.", ["lake", "walking", "photography"], 2),
        ("Amburiq Mosque", "Fourteenth-century timber mosque, an award-winning restoration.", ["heritage", "culture", "walking"], 3),
        ("Shigar Cold Desert", "Sand dunes and braided river channels between Skardu and Shigar.", ["desert", "photography", "road-trip"], 4),
        ("Askole", "Last village on the road to Baltoro — the K2 and Concordia trailhead.", ["trekking", "camping", "high-altitude"], 5),
        ("Chutron Hot Springs", "Natural sulphur springs in the upper Shigar valley.", ["walking", "culture"], 6),
    ],
    "Khaplu": [
        ("Khaplu Palace", "Yabgo Khar, the restored 'Fort on the Roof' and heritage museum.", ["heritage", "walking", "culture"], 1),
        ("Chaqchan Mosque", "Fourteenth-century wood-and-stone mosque, among the oldest in the region.", ["heritage", "culture", "walking"], 2),
        ("Hushe Valley", "Approach valley for Masherbrum and the K6/K7 climbing peaks.", ["trekking", "camping", "high-altitude"], 3),
        ("Machulu Viewpoint", "Ridge terrace looking straight down the Hushe valley to Masherbrum.", ["viewpoint", "photography", "jeep"], 4),
        ("Saling", "Orchard village and walking country on the way to Hushe.", ["walking", "culture"], 5),
    ],
    "Deosai": [
        ("Sheosar Lake", "Shallow 4,142 m lake on the plateau, framed by Nanga Parbat on clear days.", ["lake", "high-altitude", "camping", "photography"], 1),
        ("Deosai Plains", "Wildflower plateau and Himalayan brown bear habitat.", ["high-altitude", "wildlife", "road-trip"], 2),
        ("Bara Pani", "Main river crossing and camping ground in the middle of the park.", ["camping", "river", "high-altitude"], 3),
        ("Kala Pani", "Stream crossing and rest stop on the Skardu approach.", ["river", "road-trip"], 4),
        ("Chota Pani", "Second crossing and a common photo halt on the plateau traverse.", ["river", "photography"], 5),
        ("Deosai Top", "Highest point of the Skardu-Astore traverse.", ["viewpoint", "high-altitude", "road-trip"], 6),
    ],
    "Astore": [
        ("Rama Lake", "Forest-ringed glacial lake above Rama meadow.", ["lake", "forest", "walking"], 1),
        ("Rama Meadows", "Camping meadow and Nanga Parbat viewpoint above Astore town.", ["meadow", "camping", "photography"], 2),
        ("Rupal Valley", "Base of the 4,600 m Rupal Face, the highest mountain wall on earth.", ["trekking", "high-altitude", "camping"], 3),
        ("Minimarg", "Green valley on the Burzil Pass road, subject to permit checks.", ["meadow", "road-trip", "camping"], 4),
        ("Chilam", "Astore-side gateway to Deosai and the Sheosar approach.", ["road-trip", "high-altitude"], 5),
    ],
    "Fairy Meadows": [
        ("Fairy Meadows", "The meadow itself — grassland camp facing the Nanga Parbat north face.", ["meadow", "camping", "photography"], 1),
        ("Nanga Parbat Base Camp", "Full-day trek from the meadow to the foot of the Diamir Face.", ["trekking", "high-altitude", "glacier"], 2),
        ("Beyal Camp", "Halfway camp between the meadow and base camp.", ["trekking", "camping"], 3),
        ("Raikot Bridge Jeep Track", "The notorious jeep road from the KKH up to Tato village.", ["jeep", "road-trip"], 4),
        ("Reflection Lake", "Small pool near Beyal that mirrors Nanga Parbat in still weather.", ["lake", "trekking", "photography"], 5),
    ],
    "Phander": [
        ("Phander Lake", "Blue-green lake and river braid, one of Ghizer's signature views.", ["lake", "photography", "walking"], 1),
        ("Phander Valley Meadows", "Poplar-lined fields and terraces around the lake.", ["meadow", "walking", "camping"], 2),
        ("Handrap Lake", "Higher lake and camping meadow above Phander.", ["lake", "trekking", "camping"], 3),
        ("Phander Trout Point", "River stretch known locally for trout fishing.", ["river", "walking"], 4),
    ],
    "Gupis": [
        ("Khalti Lake", "Riverside lake that freezes solid in winter, on the Gilgit-Shandur road.", ["lake", "road-trip", "photography"], 1),
        ("Yasin Valley", "Side valley of villages, meadows and onward high passes.", ["culture", "meadow", "road-trip"], 2),
        ("Ghizer River", "The valley's river, followed the whole way toward Shandur.", ["river", "photography"], 3),
        ("Gupis Bazaar", "Supply stop before the long run to Phander and Shandur.", ["walking", "shopping"], 4),
    ],
    "Shandur": [
        ("Shandur Lake", "Shallow lake on the 3,700 m pass, beside the polo ground.", ["lake", "high-altitude", "camping"], 1),
        ("Shandur Polo Ground", "Host of the July free-style polo festival, the world's highest.", ["polo", "culture", "camping"], 2),
        ("Shandur Pass", "The crossing itself, linking Chitral with Ghizer.", ["road-trip", "high-altitude", "viewpoint"], 3),
    ],
    "Mastuj": [
        ("Mastuj Fort", "Historic fort of the Mastuj rulers on the Shandur route.", ["heritage", "walking"], 1),
        ("Mastuj Valley", "Wide upper-Chitral valley of orchards and stone villages.", ["culture", "walking", "photography"], 2),
        ("Shandur Road from Mastuj", "Rough but scenic jeep run up to the pass.", ["jeep", "road-trip", "high-altitude"], 3),
    ],
    "Chitral": [
        ("Chitral Fort", "Riverside fort of the Chitral rulers below Tirich Mir.", ["heritage", "walking", "photography"], 1),
        ("Shahi Masjid", "Early twentieth-century royal mosque next to the fort.", ["heritage", "culture", "walking"], 2),
        ("Garam Chashma", "Hot sulphur springs in a valley north-west of town.", ["road-trip", "culture", "walking"], 3),
        ("Chitral Gol National Park", "Markhor habitat in the side valley above Chitral.", ["wildlife", "trekking", "high-altitude"], 4),
        ("Tirich Mir Viewpoint", "Vantage points around town facing the 7,708 m Hindu Kush high point.", ["viewpoint", "photography"], 5),
        ("Chitral Museum", "Regional archaeology and Kalasha ethnography collection.", ["heritage", "culture", "walking"], 6),
        ("Lowari Tunnel", "All-weather tunnel that replaced the seasonal Lowari Pass.", ["road-trip", "photography"], 7),
    ],
    "Kalash Valleys": [
        ("Bumburet Valley", "Largest and most visited of the three Kalasha valleys.", ["culture", "walking", "road-trip"], 1),
        ("Rumbur Valley", "Quieter Kalasha valley with traditional terraced villages.", ["culture", "walking"], 2),
        ("Birir Valley", "Southernmost valley, known for its winter Chawmos festival.", ["culture", "walking"], 3),
        ("Kalasha Dur Museum", "Community museum and cultural centre in Bumburet.", ["heritage", "culture", "walking"], 4),
        ("Chilam Joshi Festival Grounds", "Where the May spring festival is held — the busiest week of the year.", ["culture", "photography"], 5),
    ],
    "Swat": [
        ("Malam Jabba", "Pakistan's best-known ski resort, an easy day trip from Mingora.", ["skiing", "chairlift", "road-trip"], 1),
        ("Swat Museum", "Gandhara sculpture collection in Saidu Sharif.", ["heritage", "culture", "walking"], 2),
        ("Bahrain", "Riverside bazaar town where the Daral and Swat rivers meet.", ["river", "walking", "shopping"], 3),
        ("Madyan", "Craft and shawl bazaar on the road to Kalam.", ["culture", "shopping", "walking"], 4),
        ("Miandam", "Terraced hill resort of orchards and walking trails.", ["forest", "walking", "photography"], 5),
        ("Butkara Stupa", "Major Buddhist stupa complex on the edge of Mingora.", ["heritage", "walking"], 6),
        ("White Palace Marghazar", "Marble summer palace of the Wali of Swat.", ["heritage", "walking", "photography"], 7),
        ("Gabin Jabba", "High forest meadow reached by jeep from Manglawar.", ["meadow", "jeep", "camping"], 8),
        ("Fizagat Park", "Riverside park and food strip just outside Mingora.", ["walking", "river"], 9),
    ],
    "Kalam": [
        ("Mahodand Lake", "Trout lake at the head of the Ushu valley, reached by jeep.", ["lake", "jeep", "camping", "photography"], 1),
        ("Ushu Forest", "Deodar forest and river flats between Kalam and Matiltan.", ["forest", "walking", "river"], 2),
        ("Kundol Lake", "Alpine lake trekked above Utror, quieter than Mahodand.", ["lake", "trekking", "high-altitude"], 3),
        ("Spin Khwar Lake", "Lake beyond Kundol on the same Utror trek.", ["lake", "trekking", "camping"], 4),
        ("Matiltan", "Village facing Falak Sar, Swat's highest peak.", ["viewpoint", "walking", "photography"], 5),
        ("Gabral Valley", "Side valley of meadows and trout streams west of Kalam.", ["river", "meadow", "camping"], 6),
        ("Boyun", "Meadow shelf above Kalam with valley-wide views.", ["meadow", "walking", "viewpoint"], 7),
        ("Utror Valley", "Green valley and trailhead for the upper Swat lakes.", ["meadow", "trekking", "jeep"], 8),
    ],
    "Malam Jabba": [
        ("Malam Jabba Ski Resort", "Groomed slopes, rentals and instruction through the winter season.", ["skiing", "high-altitude"], 1),
        ("Malam Jabba Chairlift", "Year-round chairlift to the ridge above the resort.", ["chairlift", "viewpoint", "photography"], 2),
        ("Zipline and Adventure Park", "Summer zipline, archery and trail activities at the resort.", ["walking", "viewpoint"], 3),
        ("Malam Jabba Stupa", "Buddhist-era ruins on the hillside beside the resort road.", ["heritage", "walking"], 4),
    ],
    "Kumrat": [
        ("Kumrat Forest", "Vast deodar forest and riverside camping along the Panjkora.", ["forest", "camping", "river"], 1),
        ("Jahaz Banda Meadows", "Broad meadow camp reached by jeep and a walking trail from Thal.", ["meadow", "trekking", "camping"], 2),
        ("Katora Lake", "Bowl-shaped lake above Jahaz Banda, a demanding day hike.", ["lake", "trekking", "high-altitude"], 3),
        ("Kala Chashma", "Cold spring and picnic stop on the valley floor.", ["river", "walking"], 4),
        ("Panjkora River", "The river that runs the length of the valley.", ["river", "photography", "camping"], 5),
        ("Badgoi Pass", "High crossing between Kumrat and Swat, open only in summer.", ["high-altitude", "trekking", "jeep"], 6),
    ],
    "Neelum Valley": [
        ("Ratti Gali Lake", "Alpine lake above Dowarian, reached by jeep then a walk.", ["lake", "jeep", "trekking", "high-altitude"], 1),
        ("Arang Kel", "Meadow village above Kel, reached by chairlift and a climb.", ["meadow", "walking", "chairlift"], 2),
        ("Sharda", "Riverside town with the ruins of the ancient Sharda university.", ["heritage", "river", "walking"], 3),
        ("Keran", "Riverside village facing the Line of Control, popular for riverside huts.", ["river", "walking", "photography"], 4),
        ("Kel", "Upper-valley base for Arang Kel and the Shounter road.", ["river", "camping", "road-trip"], 5),
        ("Chitta Katha Lake", "Trekking lake above Shounter valley in the Shams Bari range.", ["lake", "trekking", "high-altitude"], 6),
        ("Taobat", "Last village of the valley, at the head of the Neelum River.", ["river", "culture", "road-trip"], 7),
        ("Kutton Jagran Valley", "Waterfalls and trout farms near the valley entrance.", ["waterfall", "river", "walking"], 8),
        ("Dhani Waterfall", "Roadside waterfall between Kutton and Keran.", ["waterfall", "road-trip", "photography"], 9),
    ],
    "Muzaffarabad": [
        ("Pir Chinasi", "Shrine and ridge viewpoint 2,900 m above the city.", ["viewpoint", "road-trip", "walking"], 1),
        ("Red Fort Muzaffarabad", "Sixteenth-century riverside fort above the Neelum.", ["heritage", "walking", "photography"], 2),
        ("Domel Confluence", "Where the Neelum and Jhelum rivers meet in the city.", ["river", "walking", "photography"], 3),
        ("Shaheed Gali", "Forested ridge and picnic area on the Neelum road.", ["forest", "walking"], 4),
        ("Patika", "Riverside stop on the way into the Neelum Valley.", ["river", "road-trip"], 5),
    ],
    "Leepa Valley": [
        ("Leepa Village", "Terraced rice fields and wooden houses on the valley floor.", ["culture", "walking", "photography"], 1),
        ("Reshian Gali", "Pass above the valley, the only road in and out.", ["viewpoint", "road-trip", "forest"], 2),
        ("Chananian", "Meadow and forest area above Leepa, good for a day walk.", ["meadow", "forest", "walking"], 3),
    ],
    "Toli Pir": [
        ("Toli Pir Top", "Shrine and 2,400 m ridge with views across the Poonch valleys.", ["viewpoint", "walking", "photography"], 1),
        ("Toli Pir Meadows", "Open grassland along the ridge road from Rawalakot.", ["meadow", "walking", "camping"], 2),
        ("Poonch Valley Viewpoint", "Roadside vantage on the climb up from Rawalakot.", ["viewpoint", "road-trip"], 3),
    ],
    "Banjosa Lake": [
        ("Banjosa Lake", "Artificial forest lake and boating spot above Rawalakot.", ["lake", "boating", "walking"], 1),
        ("Banjosa Forest Park", "Pine walks and picnic lawns around the lake.", ["forest", "walking", "photography"], 2),
        ("Devi Gali", "Ridge stop on the Rawalakot-Banjosa road.", ["viewpoint", "road-trip"], 3),
    ],
}

# ---------------------------------------------------------------------------
# Gear images (served from the `gear` folder at the backend root)
# ---------------------------------------------------------------------------
GEAR_IMAGE_BASE = "/static/gear"

# The downloaded baseline images have mixed extensions, so these paths mirror
# the actual files rather than assuming a single image format.
CATEGORY_IMAGE_POOLS: dict[str, list[str]] = {
    "Jacket": [
        f"{GEAR_IMAGE_BASE}/baseline/jacket1.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket2.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/jacket3.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket4.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket5.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/jacket6.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket7.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket8.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket9.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket10.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket11.png",
        f"{GEAR_IMAGE_BASE}/baseline/jacket12.jfif",
    ],
    "Kit": [f"{GEAR_IMAGE_BASE}/baseline/kit{i}.jfif" for i in range(1, 10)],
    "Poles": [
        f"{GEAR_IMAGE_BASE}/baseline/pole1.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole2.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole3.png",
        f"{GEAR_IMAGE_BASE}/baseline/pole4.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole5.png",
        f"{GEAR_IMAGE_BASE}/baseline/pole6.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole7.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole8.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole9.jfif",
        f"{GEAR_IMAGE_BASE}/baseline/pole10.jfif",
    ],
    "Power": [f"{GEAR_IMAGE_BASE}/baseline/power{i}.jfif" for i in range(1, 11)],
    "Tent": [f"{GEAR_IMAGE_BASE}/tent_four_season.png"],
    "Layers": [f"{GEAR_IMAGE_BASE}/sleepingbag_insulated.png"],
}

_category_image_cursor: dict[str, int] = {}


def next_gear_image(category: str) -> str:
    """Return the next category image, wrapping when its pool is exhausted."""
    pool = CATEGORY_IMAGE_POOLS.get(category)
    if not pool:
        return ""
    idx = _category_image_cursor.get(category, 0)
    _category_image_cursor[category] = idx + 1
    return pool[idx % len(pool)]


CATALOG_PRODUCTS = [
    {"vendor": "Kaghan Outdoors", "name": "All-weather Trekking Jacket", "category": "Jacket", "rent_price_per_day": 900, "buy_price": 11500, "rating": 4.7, "use_tags": ["walking", "trekking", "high-altitude", "jeep"], "stock_quantity": 12, "image_url": f"{GEAR_IMAGE_BASE}/jacket_allweather_trekking.png"},
    {"vendor": "Kaghan Outdoors", "name": "Four-season Camping Tent", "category": "Tent", "rent_price_per_day": 1800, "buy_price": 26000, "rating": 4.8, "use_tags": ["camping", "meadow", "high-altitude"], "stock_quantity": 6, "image_url": f"{GEAR_IMAGE_BASE}/tent_four_season.png"},
    {"vendor": "Kaghan Outdoors", "name": "Trekking Pole Pair", "category": "Poles", "rent_price_per_day": 450, "buy_price": 4900, "rating": 4.6, "use_tags": ["walking", "trekking", "glacier"], "stock_quantity": 18, "image_url": f"{GEAR_IMAGE_BASE}/poles_trekking.png"},
    {"vendor": "Kaghan Outdoors", "name": "Trail First-aid Kit", "category": "Kit", "rent_price_per_day": 300, "buy_price": 2200, "rating": 4.9, "use_tags": ["walking", "trekking", "road-trip", "camping"], "stock_quantity": 25, "image_url": f"{GEAR_IMAGE_BASE}/kit_first_aid_basic.png"},
    {"vendor": "Hunza Adventure Gear Rentals", "name": "Insulated Sleeping Bag", "category": "Layers", "rent_price_per_day": 700, "buy_price": 9800, "rating": 4.8, "use_tags": ["camping", "high-altitude", "trekking"], "stock_quantity": 10, "image_url": f"{GEAR_IMAGE_BASE}/sleepingbag_insulated.png"},
    {"vendor": "Hunza Adventure Gear Rentals", "name": "20,000mAh Power Bank", "category": "Power", "rent_price_per_day": 250, "buy_price": 3500, "rating": 4.7, "use_tags": ["road-trip", "photography", "camping"], "stock_quantity": 20, "image_url": f"{GEAR_IMAGE_BASE}/powerbank_20000mah.png"},
    {"vendor": "Baltoro Outfitters", "name": "High-altitude Down Jacket", "category": "Jacket", "rent_price_per_day": 1500, "buy_price": 24500, "rating": 4.9, "use_tags": ["high-altitude", "camping", "trekking"], "stock_quantity": 8, "image_url": f"{GEAR_IMAGE_BASE}/jacket_down_highaltitude.png"},
    {"vendor": "Baltoro Outfitters", "name": "Expedition First-aid Kit", "category": "Kit", "rent_price_per_day": 600, "buy_price": 6500, "rating": 4.9, "use_tags": ["high-altitude", "trekking", "camping"], "stock_quantity": 15, "image_url": f"{GEAR_IMAGE_BASE}/kit_first_aid_expedition.png"},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_factory() as db:
        dest_map: dict[str, int] = {}
        for d in DESTINATIONS:
            dest = await db.scalar(
                select(Destination).where(Destination.name == d["name"])
            )
            if dest is None:
                dest = Destination(**d)
                db.add(dest)
                await db.flush()
            dest_map[dest.name] = dest.id

        for dest_name, vendor_list in VENDORS.items():
            dest_id = dest_map[dest_name]
            for v in vendor_list:
                vendor = await db.scalar(
                    select(Vendor).where(
                        Vendor.destination_id == dest_id,
                        Vendor.name == v["name"],
                    )
                )
                if vendor is None:
                    db.add(
                        Vendor(
                            destination_id=dest_id,
                            last_verified_on=date.today(),
                            is_active=True,
                            **v,
                        )
                    )

        # Ensure every destination has a rental operator, so destination-aware
        # recommendations never lead to an empty catalogue.
        for dest_name, dest_id in dest_map.items():
            existing_gear_vendor = await db.scalar(
                select(Vendor).where(Vendor.destination_id == dest_id, Vendor.type == "gear_rental")
            )
            if existing_gear_vendor is None:
                db.add(Vendor(
                    destination_id=dest_id,
                    name=f"{dest_name} Gear Rentals",
                    type="gear_rental",
                    description="Verified local rental listing. Confirm current stock and collection arrangements before travel.",
                    last_verified_on=date.today(),
                    is_active=True,
                ))
        await db.flush()

        # Famous areas per destination. Idempotent: new names are inserted and
        # rows seeded by earlier revisions get their copy and ranking refreshed,
        # so re-running the seeder never duplicates an attraction.
        await _merge_legacy_places(db, dest_map)
        place_count = 0
        for dest_name, records in FAMOUS_PLACES.items():
            dest_id = dest_map.get(dest_name)
            if dest_id is None:
                # A curated place list without a matching destination would be
                # invisible in the planner — surface it instead of silently skipping.
                print(f"  ! skipping places for unknown destination {dest_name!r}")
                continue
            for name, description, tags, rank in records:
                place = await db.scalar(
                    select(Place).where(Place.destination_id == dest_id, Place.name == name)
                )
                if place is None:
                    db.add(Place(
                        destination_id=dest_id,
                        name=name,
                        description=description,
                        activity_tags=tags,
                        community_rating=None,
                        review_count=0,
                        community_review="",
                        image_url="",
                        popularity_rank=rank,
                    ))
                else:
                    place.description = description
                    place.activity_tags = tags
                    place.popularity_rank = rank
                place_count += 1
        await db.flush()

        # Named catalogue data is kept above for easy price/image maintenance.
        # All remaining destinations receive a useful baseline rental selection.
        for record in CATALOG_PRODUCTS:
            vendor = await db.scalar(select(Vendor).where(Vendor.name == record["vendor"]))
            product = (
                await db.scalar(
                    select(Product).where(
                        Product.vendor_id == vendor.id, Product.name == record["name"]
                    )
                )
                if vendor
                else None
            )
            if vendor and product is None:
                payload = {key: value for key, value in record.items() if key != "vendor"}
                db.add(Product(vendor_id=vendor.id, is_active=True, **payload))
            elif product and not product.image_url:
                product.image_url = record["image_url"]
        for dest_name, dest_id in dest_map.items():
            vendor = await db.scalar(select(Vendor).where(Vendor.destination_id == dest_id, Vendor.type == "gear_rental").order_by(Vendor.id))
            baseline = [
                ("Mountain Rain Jacket", "Jacket", 800, 10500, ["walking", "trekking", "road-trip", "high-altitude"]),
                ("Adjustable Trekking Poles", "Poles", 400, 4200, ["walking", "trekking", "glacier"]),
                ("Travel First-aid Kit", "Kit", 250, 1800, ["walking", "road-trip", "camping"]),
                ("20,000mAh Power Bank", "Power", 250, 3500, ["road-trip", "photography", "camping"]),
            ]
            for name, category, rent, buy, tags in baseline:
                image_url = next_gear_image(category)
                product = await db.scalar(
                    select(Product).where(Product.vendor_id == vendor.id, Product.name == name)
                )
                if product is None:
                    db.add(Product(vendor_id=vendor.id, name=name, category=category, rent_price_per_day=rent, buy_price=buy, rating=None, image_url=image_url, use_tags=tags, stock_quantity=12, is_active=True))
                elif not product.image_url:
                    product.image_url = image_url

        await db.commit()
        print(
            f"Seeded {len(DESTINATIONS)} destinations, {place_count} famous places "
            "and catalogue listings."
        )


if __name__ == "__main__":
    asyncio.run(seed())
