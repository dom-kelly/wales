import React, { useState, useMemo, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { MapPin, Clock, Car, Bed, Utensils, Camera, Phone, ExternalLink, Check, X, Navigation, ChevronDown, ChevronRight, ChevronLeft, Calendar, Users, PoundSterling, AlertCircle, Mountain, Waves, Trees, Castle, Zap, ShoppingCart, Lock, Unlock, Trash2 } from 'lucide-react';
import { useSharedState, usePhotos, useAuth, useCheckin } from './api.js';
import { readPhotoExif } from './exif.js';

const TRIP = {
  title: "Wales 2026",
  subtitle: "Eight nights · A family of four · A campervan",
  dates: "1–9 August 2026",
  party: "Dom + Mason (6) + Harper (10) + Mylo (16, tent)",
  vehicle: "VW California Coast · ViewStalkers · 4 belts",
  totalMiles: "~950",
  totalDrivingHrs: "~24h"
};

const DAYS = [
  {
    num: 1, date: "Sat 1 Aug", weekday: "Saturday",
    title: "Pickup & Conwy Valley",
    blurb: "Drive south-west via Wales' tallest waterfall and a riverside dinner in Llangollen.",
    drive: { miles: 180, hrs: "3h 30m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Follifoot+HG3&destination=Erw+Glas+Maenan+LL26+0YP&waypoints=Pistyll+Rhaeadr+SY10+0BZ%7CThe+Corn+Mill+Llangollen+LL20+8PN&travelmode=driving",
    stops: [
      { time: "~10:00", type: "pickup", name: "Van pickup", loc: "Follifoot", notes: "£50 early-pickup fee to pay James via Goboony beforehand." },
      { time: "~13:00", type: "food", name: "The Corn Mill", loc: "Llangollen", notes: "Riverside pub-restaurant in a converted 18th-century watermill above the River Dee. Book a terrace table for lunch — Saturday August gets rammed even at lunchtime.", link: "https://www.cornmill-llangollen.co.uk/", booking: "table" },
      { time: "~15:30", type: "sight", name: "Pistyll Rhaeadr", loc: "Powys", notes: "Wales' tallest single-drop waterfall (240ft). £5 parking. Narrow lanes last 3 miles. Skip if you'd rather a calmer first day.", optional: true },
      { time: "~17:30", type: "stay", name: "Erw Glas Glamping & Camping", loc: "Maenan · Night 1", notes: "Award-winning small family-run site directly off the A470 (no hill access), 4.8★. Pre-order a fresh takeaway pizza for tonight + breakfast hamper for the morning. On-site shop sells firewood, coal, drinks, ice-cream. Free-roaming chickens and friendly alpacas nearby — kids will love it.", phone: "01492 702486", link: "https://www.erwglasglampingandcamping.co.uk/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "Takeaway pizza at the van", loc: "Erw Glas", notes: "Fresh wood-fired pizza from the on-site Chill & Grill — pre-order when you book, collect from the site bar, eat back at the van." }
    ]
  },
  {
    num: 2, date: "Sun 2 Aug", weekday: "Sunday",
    title: "Conwy + Fforest Coaster + Snowdonia",
    blurb: "Castle in the morning, alpine coaster the whole family can ride, scenic drive through Ogwen Valley & Llanberis Pass.",
    drive: { miles: 70, hrs: "2h 30m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Erw+Glas+Maenan+LL26+0YP&destination=Snowdon+Base+Camp+Rhyd-Ddu+LL54+7YS&waypoints=Conwy+Castle+LL32+8AY%7CZip+World+Betws-y-Coed+LL24+0HX%7CLlyn+Idwal+LL57%7CLone+Tree+Cafe+Llanberis+LL55+4EL%7CSPAR+Llanberis+LL55+4SU&travelmode=driving",
    stops: [
      { time: "~09:00", type: "depart", name: "Depart Erw Glas", loc: "Maenan", notes: "30 min drive to Conwy Castle." },
      { time: "09:30", type: "sight", name: "Conwy Castle", loc: "Conwy", notes: "13th-century medieval fortress built by Edward I — UNESCO World Heritage Site. Plan ~90 minutes inside (8 towers to climb, Royal Apartments, Great Hall). Mostly outdoors and roofless — bring waterproofs. Car park (LL32 8AY) is right at the entrance but fills by 11am in August; long-stay parking near the quay is a 5-min walk if full. Cadw membership pays back with 3+ castles.", link: "https://cadw.gov.wales/visit/places-to-visit/conwy-castle" },
      { time: "12:30", type: "activity", name: "Fforest Coaster", loc: "Zip World Betws-y-Coed", notes: "Alpine coaster everyone can ride (Mason on your lap from age 3, Harper & Mylo solo from 9+). Pre-book a slot.", link: "https://www.zipworld.co.uk/adventure/fforest-coaster", booking: "urgent" },
      { time: "~13:45", type: "food", name: "Lunch at the Tipi Bar", loc: "Zip World Betws-y-Coed", notes: "On-site bar at the Zip World base — wood-fired pizzas, burgers, salads. Outdoor seating under canvas." },
      { time: "15:30", type: "sight", name: "Llyn Idwal", loc: "Ogwen Valley", notes: "Glacial mountain lake with the dramatic Devil's Kitchen cleft as a backdrop — one of Snowdonia's most photographed spots. Short walk from Idwal Cottage car park to the shore. £3 parking. Car park fills early in August — have a plan B if full." },
      { time: "16:45", type: "sight", name: "Lonely Tree, Llyn Padarn", loc: "Llanberis", notes: "A single windswept tree on a small rocky islet in Llyn Padarn lake — one of the most photographed scenes in Wales, with Snowdon behind. 5min walk from Lone Tree Cafe car park." },
      { time: "~17:15", type: "shop", name: "Shop at SPAR Llanberis", loc: "Llanberis", notes: "Right on the high street as you pass through. Well-stocked for a village shop (locals rate it highly) — burgers, sausages, marshmallows, jacket potatoes, milk + bacon for breakfast. Stock up for the next 2 nights of BBQ at Snowdon Base Camp." },
      { time: "~18:30", type: "stay", name: "Snowdon Base Camp", loc: "Rhyd-Ddu · Night 2", notes: "Owned by Cwellyn Arms pub but 0.5mi away. Check in at the pub then drive to the site. Only 3 campervan EHU bays — book one specifically. Buy kiln-dried logs at the pub on the way in (£7/bag, NO charcoal allowed).", phone: "01766 890321", link: "http://www.snowdoninn.co.uk/", booking: "pitch" },
      { time: "~19:30", type: "food", name: "Fire-pit BBQ at the lake", loc: "Snowdon Base Camp", notes: "Cook over the kiln-dried logs in the site's fire-pit grills. Lakeside with Snowdon as backdrop — proper memory-maker for the kids." }
    ]
  },
  {
    num: 3, date: "Mon 3 Aug", weekday: "Monday",
    title: "Anglesey loop",
    blurb: "Day-trip from basecamp to Anglesey — Mars-like copper mine, sheltered cove lunch, dramatic lighthouse cliffs.",
    drive: { miles: 130, hrs: "3h 00m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Snowdon+Base+Camp+Rhyd-Ddu+LL54+7YS&destination=Snowdon+Base+Camp+Rhyd-Ddu+LL54+7YS&waypoints=Mynydd+Parys+LL68+9RE%7CChurch+Bay+LL65%7CSouth+Stack+Lighthouse+LL65+1YH&travelmode=driving",
    stops: [
      { time: "~08:45", type: "depart", name: "Depart Snowdon Base Camp", loc: "Rhyd-Ddu", notes: "1h 15min drive to Parys Mountain — early start for a full Anglesey day." },
      { time: "10:00", type: "sight", name: "Parys Mountain", loc: "Amlwch", notes: "Vast abandoned copper mine with vivid orange, red and yellow rock — feels like walking on Mars. Free parking, network of waymarked paths around the old workings, takes 1–2 hours to explore. Kids love it." },
      { time: "12:30", type: "food", name: "Church Bay", loc: "Anglesey", notes: "Tiny tucked-away cove with a sandy beach and one famous pub — The Lobster Pot — known for fresh local seafood. Good lunch spot with a paddle for the kids if the tide's right." },
      { time: "14:30", type: "sight", name: "South Stack Lighthouse", loc: "Holyhead", notes: "Working lighthouse on a tiny rocky island off Holy Island's western tip, reached by a steep staircase of 400 steps down the cliff. RSPB nature reserve at the top — puffins, guillemots and razorbills nest on the cliffs May–July." },
      { time: "~18:30", type: "stay", name: "Snowdon Base Camp", loc: "Rhyd-Ddu · Night 3", notes: "Same base. Already have logs and BBQ supplies from yesterday." , booking: "pitch" },
      { time: "~19:30", type: "food", name: "Fire-pit BBQ at the lake", loc: "Snowdon Base Camp", notes: "Final night on Llyn Cwellyn. Use remaining logs and BBQ supplies from yesterday's shop." }
    ]
  },
  {
    num: 4, date: "Tue 4 Aug", weekday: "Tuesday",
    title: "Cregennen → Bennar Beach",
    blurb: "Ice cream in Wales' prettiest village, picnic by twin mountain lakes, then on to a dune-backed beach campsite on the Cambrian coast.",
    drive: { miles: 80, hrs: "2h 30m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Snowdon+Base+Camp+Rhyd-Ddu+LL54+7YS&destination=Bennar+Beach+Dyffryn+Ardudwy+LL44+2RX&waypoints=Beddgelert+LL55+4YE%7CTesco+Porthmadog+LL49+9DB%7CLlynnau+Cregennen+LL39+1LJ&travelmode=driving",
    stops: [
      { time: "~09:20", type: "depart", name: "Depart Snowdon Base Camp", loc: "Rhyd-Ddu", notes: "10 min drive to Beddgelert." },
      { time: "~09:30", type: "sight", name: "Beddgelert", loc: "Snowdonia", notes: "Stone-built village at the confluence of two rivers, surrounded by mountains — often called the prettiest village in Wales. Quick stop for Glaslyn Ices (iconic family-run ice-cream parlour) and a leg-stretch by the bridge." },
      { time: "~10:30", type: "shop", name: "Shop at Tesco Porthmadog", loc: "Porthmadog", notes: "Big shop for the next 2 days: picnic lunch for today, BBQ supplies for tonight (Bennar Beach) and tomorrow night (Llanrhystud), plus milk + bacon for breakfasts. Bennar has no on-site shop, so stock up properly here. Direct on the A487, ~25 min stop." },
      { time: "~11:30", type: "food", name: "Picnic at Llynnau Cregennen", loc: "near Dolgellau", notes: "Two small mountain lakes high on the southern flank of Cadair Idris, with views across the Mawddach estuary to Barmouth. National Trust land, picnic benches by the water. Single-track gated road in — slow approach in the van." },
      { time: "~15:00", type: "stay", name: "Bennar Beach", loc: "Dyffryn Ardudwy · Night 4", notes: "Quiet all-grass beach campsite on the Cambrian coast, halfway between Barmouth and Harlech, with the Rhinog mountains behind. A wooden boardwalk leads straight through the dunes to a sandy beach (5–10 min walk). Generous 9×9m EHU pitches for the van. No on-site shop — chippy + pub at the neighbouring park, and an award-winning butcher at the village SPAR. No noise after 10pm.", phone: "01341 247001", link: "https://www.bennar.co.uk/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "Raised BBQ by the dunes", loc: "Bennar Beach", notes: "Off-ground fire pits / raised BBQs are allowed — cook at the pitch then carry chairs over the boardwalk for sunset on the beach. Dispose of ash in the metal bin in the refuse area (site rule)." }
    ]
  },
  {
    num: 5, date: "Wed 5 Aug", weekday: "Wednesday",
    title: "Harlech → Cambrian coast",
    blurb: "Clifftop UNESCO castle, fish & chips at a Victorian seaside town, on to the Cambrian coast at Llanrhystud.",
    drive: { miles: 73, hrs: "2h 45m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Bennar+Beach+Dyffryn+Ardudwy+LL44+2RX&destination=Pengarreg+Caravan+Park+Llanrhystud+SY23+5DJ&waypoints=Harlech+Castle+LL46+2YH%7CBarmouth+LL42+1NB&travelmode=driving",
    stops: [
      { time: "~09:45", type: "depart", name: "Depart Bennar Beach", loc: "Dyffryn Ardudwy", notes: "~15 min drive north up the coast to Harlech Castle." },
      { time: "~10:00", type: "sight", name: "Harlech Castle", loc: "Harlech", notes: "Dramatic 13th-century cliff-top fortress built by Edward I — UNESCO World Heritage Site, perched on a 200ft rock with views across Tremadog Bay to Snowdonia. The site of the longest siege in British history. ~45min visit.", link: "https://cadw.gov.wales/visit/places-to-visit/harlech-castle" },
      { time: "~12:30", type: "food", name: "Fish & chips at Barmouth", loc: "Barmouth", notes: "Classic Welsh seaside town with a long sandy beach and a Victorian harbour. The Mermaid (high street) and Davy Jones' Locker (seafront) both serve traditional fish & chips. Eat on the prom watching the Mawddach estuary." },
      { time: "~17:00", type: "stay", name: "Pengarreg Caravan Park", loc: "Llanrhystud · Night 5", notes: "Family-run park perched right on the coastline 9 miles south of Aberystwyth, with sweeping Cardigan Bay views and seafront touring pitches. A mile of coastline with direct beach access, plus The Barn restaurant on site (dog-friendly). Just off the A487 in Llanrhystud village.", phone: "01974 202247", link: "https://pengarregcaravanpark.co.uk/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "BBQ with sea views", loc: "Llanrhystud", notes: "Cook from yesterday's Tesco Porthmadog shop. BBQs are allowed at Pengarreg — use the borrowed stand to keep it off the grass anyway. West-facing seafront pitch, so sunset straight over Cardigan Bay." }
    ]
  },
  {
    num: 6, date: "Thu 6 Aug", weekday: "Thursday",
    title: "Cardigan Bay",
    blurb: "Short hop south. Dolphin spotting at New Quay, then a cliff-top campsite above one of Wales' prettiest small beaches.",
    drive: { miles: 31, hrs: "1h 15m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Pengarreg+Caravan+Park+Llanrhystud+SY23+5DJ&destination=Ty+Gwyn+Caravan+and+Camping+Park+SA43+1QH&waypoints=Costcutter+Aberaeron+SA46+0AS%7CNew+Quay+SA45&travelmode=driving",
    stops: [
      { time: "~09:10", type: "depart", name: "Depart Pengarreg", loc: "Llanrhystud", notes: "~30 min drive south down the A487 to Aberaeron." },
      { time: "~10:00", type: "shop", name: "Shop at Costcutter Aberaeron", loc: "Aberaeron", notes: "Mid-trip top-up shop, on route. Surprisingly well-stocked for a small-town shop — locals rate it. Buy for the next 2 nights of BBQ (Tŷ Gwyn Mwnt tonight, Porthclais tomorrow), plus milk + bacon for breakfasts. Pretty Georgian harbour town if you want to wander after." },
      { time: "11:00", type: "sight", name: "Arrive New Quay", loc: "Ceredigion", notes: "Pretty fishing village on Cardigan Bay with brightly painted houses tumbling down the hill to a curved harbour. Park up and walk to the Main Pier for the boat trip." },
      { time: "11:30", type: "activity", name: "Dolphin-spotting boat trip", loc: "New Quay Main Pier", notes: "1-hour cruise with New Quay Boat Trips (Dreamcatcher) into the Cardigan Bay Special Area of Conservation — resident bottlenose dolphin pod, Atlantic grey seals, sea birds. £20 adult / £10 child (£60 family of 4). Booked — arrive by 11:10. Use the loo before boarding (no toilet on the 1-hour boats). Wrap up — windy at sea.", phone: "01545 560800", link: "https://www.newquayboattrips.co.uk/", booking: "urgent" },
      { time: "~12:30", type: "food", name: "Lunch at New Quay harbour", loc: "New Quay", notes: "Plenty of options along the harbour: The Hungry Trout (modern Welsh seafood), The Lime Crab (fish & chips and lobster rolls), or The Black Lion (Dylan Thomas' pub, traditional menu). Eat on the wall watching the boats come in." },
      { time: "~15:00", type: "stay", name: "Tŷ Gwyn, Mwnt", loc: "Cardigan · Night 6", notes: "Small working-farm campsite on the clifftop directly above Mwnt beach, one of Wales' prettiest coves. 4.9★. 15-minute walk down to the beach for sunset — dolphins regularly seen in the bay from the cliff path.", phone: "01239 614518", link: "https://campingatmwnt.com/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "BBQ at the campsite", loc: "Tŷ Gwyn, Mwnt", notes: "Charcoal BBQ or open campfire — both allowed here. Best to eat as the sun drops over Cardigan Bay." }
    ]
  },
  {
    num: 7, date: "Fri 7 Aug", weekday: "Friday",
    title: "Pembrokeshire coast",
    blurb: "Round Cardigan Bay through Fishguard, lunch at a tiny harbour village, into Pembrokeshire.",
    drive: { miles: 55, hrs: "1h 45m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Ty+Gwyn+Caravan+and+Camping+Park+SA43+1QH&destination=Porthclais+Farm+Campsite+SA62+6RR&waypoints=Solva+SA62+6UU%7CSt+Davids+SA62+6PE&travelmode=driving",
    stops: [
      { time: "~11:15", type: "depart", name: "Depart Tŷ Gwyn, Mwnt", loc: "Cardigan", notes: "1h 15min drive to Solva for lunch. Slower morning option after a busy week." },
      { time: "~12:30", type: "food", name: "Lunch at Solva", loc: "Pembrokeshire", notes: "Tiny picturesque harbour village 3 miles east of St Davids — old lime kilns line the edge of the harbour, sailing boats moored up. Lunch at The Cambrian Inn (proper pub food) or one of the harbour-side cafés. Scenic 30-min walk up Solva Head if time." },
      { time: "~14:30", type: "sight", name: "St Davids", loc: "Pembrokeshire", notes: "The UK's smallest city — granted city status in the 1990s because of its 12th-century cathedral, the burial site of Wales' patron saint. Tiny medieval centre with independent shops, the ruined Bishop's Palace, ice-cream parlours." },
      { time: "~16:30", type: "stay", name: "Porthclais Farm Campsite", loc: "St Davids · Night 7", notes: "Booking confirmed. Family campsite beside Porthclais harbour, a short walk (~1 mile) from St Davids, with the Pembrokeshire Coast Path bordering the site and St Brides Bay below. No electric hook-up — this is the trip's one off-grid night (gas/leisure battery).", phone: "07970 439310", link: "https://porthclaiscampsite.co.uk/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "BBQ at the campsite", loc: "Porthclais", notes: "BBQs allowed — use the borrowed stand to keep it ≥6in off the grass, don't leave it unattended, fully extinguish after. (Porthclais rents stands for £1 + £10 deposit if needed.) Sunset over St Brides Bay with Ramsey Island offshore." }
    ]
  },
  {
    num: 8, date: "Sat 8 Aug", weekday: "Saturday",
    title: "Brecon Beacons",
    blurb: "East across Carmarthenshire, lunch at a pretty market town, on to the Beacons.",
    drive: { miles: 95, hrs: "2h 15m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Porthclais+Farm+Campsite+SA62+6RR&destination=Pencelli+Castle+Caravan+%26+Camping+Park+LD3+7LX&waypoints=Tesco+Extra+Haverfordwest+SA61+1BU%7CLlandeilo+SA19+6BB&travelmode=driving",
    stops: [
      { time: "~10:00", type: "depart", name: "Depart Porthclais", loc: "St Davids", notes: "30 min drive to Haverfordwest for the last shop of the trip." },
      { time: "~10:30", type: "shop", name: "Shop at Tesco Haverfordwest", loc: "Haverfordwest", notes: "Last shop of the trip — breakfast for Sunday + road snacks for the long drive home. ~20 min stop, on route. No BBQ supplies needed (pub dinner tonight at the Royal Oak)." },
      { time: "~12:30", type: "food", name: "Lunch at Llandeilo", loc: "Carmarthenshire", notes: "Pretty Georgian market town with colourful painted houses, independent shops, and a strong food scene. Ginhaus Deli (Rhosmaen St) does great brunch/lunch boards; The Angel does proper pub food. Quick walk to Dinefwr Park (NT) for the kids to stretch their legs if there's time." },
      { time: "~15:30", type: "stay", name: "Pencelli Castle", loc: "Brecon · Night 8", notes: "Award-winning family campsite — named after the medieval castle that once stood on the land. NOT a castle visit. Sits between the Brecon Beacons and the Monmouthshire & Brecon Canal. Heated facilities, large pitches, 4.8★. Pen-y-Fan trailhead a short drive away.", phone: "01874 665451", link: "http://www.pencelli-castle.com/", booking: "pitch" },
      { time: "~19:00", type: "food", name: "Dinner at the Royal Oak Inn", loc: "Pencelli", notes: "Last-night sit-down dinner. Family-run pub 100m from the campsite entrance — canal-side beer garden, hearty home-cooked food, real ales. 4.5★, 884 reviews. Kitchen stops taking orders at 8pm — 7pm is safest. Saturday August will be busy — BOOK A TABLE.", phone: "01874 665396", link: "https://www.facebook.com/TheRoyalOakPencelli/", booking: "table" }
    ]
  },
  {
    num: 9, date: "Sun 9 Aug", weekday: "Sunday",
    title: "Home via Ludlow",
    blurb: "Relaxed final morning at Pencelli, lunch in Ludlow, back to Follifoot by evening. Van back to James by 8pm.",
    drive: { miles: 240, hrs: "5h 00m" },
    mapsUrl: "https://www.google.com/maps/dir/?api=1&origin=Pencelli+Castle+Caravan+%26+Camping+Park+LD3+7LX&destination=Follifoot+HG3&waypoints=Ludlow+SY8&travelmode=driving",
    stops: [
      { time: "~10:30", type: "depart", name: "Depart Pencelli Castle", loc: "Brecon", notes: "2h drive to Ludlow for lunch. ~5h total driving home — need to be back to drop the van with James by 8pm." },
      { time: "~12:30", type: "food", name: "Ludlow", loc: "Shropshire", notes: "Historic Shropshire market town with a Norman castle ruin overlooking the river, half-timbered Tudor buildings, and a strong food reputation. Plenty of independent pubs and cafés around the market square for a lunch stop." },
      { time: "20:00", type: "return", name: "Van return", loc: "Follifoot", notes: "Late drop-off (£50 paid). Refuel + clean before return." }
    ]
  }
];

// Project lat/lng to SVG coords
const BOUNDS = { minLat: 51.5, maxLat: 54.2, minLng: -5.5, maxLng: -1.3 };
const VIEWBOX = { w: 500, h: 600 };
const project = (lat, lng) => {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VIEWBOX.w;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEWBOX.h;
  return [x, y];
};

const withinMap = ({ lat, lng }) =>
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;

const OVERNIGHT_COORDS = [
  { day: 1, name: "Erw Glas", lat: 53.1981, lng: -3.8240 },
  { day: 2, name: "Snowdon BC", lat: 53.0545, lng: -4.1360 },
  { day: 3, name: "Snowdon BC", lat: 53.0545, lng: -4.1360 },
  { day: 4, name: "Bennar Beach", lat: 52.7760, lng: -4.1190 },
  { day: 5, name: "Llanrhystud", lat: 52.2975, lng: -4.1665 },
  { day: 6, name: "Mwnt", lat: 52.1363, lng: -4.6342 },
  { day: 7, name: "Porthclais", lat: 51.8712, lng: -5.2834 },
  { day: 8, name: "Pencelli", lat: 51.9148, lng: -3.3179 }
];
const HOME = { name: "Follifoot", lat: 53.9663, lng: -1.4826 };

const STOP_META = {
  pickup: { icon: Car, color: "var(--accent)", label: "Pickup" },
  depart: { icon: Navigation, color: "var(--slate)", label: "Depart" },
  return: { icon: Car, color: "var(--accent)", label: "Return" },
  sight: { icon: Camera, color: "var(--green)", label: "Stop" },
  food: { icon: Utensils, color: "var(--rust)", label: "Food" },
  shop: { icon: ShoppingCart, color: "var(--accent)", label: "Shop" },
  activity: { icon: Zap, color: "var(--accent)", label: "Activity" },
  stay: { icon: Bed, color: "var(--ink)", label: "Overnight" }
};

const BOOKING_META = {
  table: { label: "Restaurant", urgency: "low" },
  pitch: { label: "Campsite", urgency: "high" },
  urgent: { label: "Activity", urgency: "critical" }
};

function StatusBadge({ booked, urgency }) {
  if (booked) return <span style={{ background: "var(--green)", color: "var(--cream)" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Booked</span>;
  if (urgency === "critical") return <span style={{ background: "var(--rust)", color: "var(--cream)" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">Book now</span>;
  return <span style={{ background: "var(--accent)", color: "var(--cream)" }} className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">To book</span>;
}

// Lets a thumbnail anywhere in the tree open the lightbox without threading a
// callback through DayCard and StopRow.
const LightboxContext = createContext(() => {});

function confirmDelete(photo, onDelete) {
  const what = photo.caption ? `"${photo.caption}"` : 'this photo';
  if (window.confirm(`Delete ${what}? This can't be undone.`)) {
    onDelete?.(photo.id);
    return true;
  }
  return false;
}

function Lightbox({ photos, index, onIndex, onClose, canEdit, onDelete }) {
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev) onIndex(index - 1);
      else if (e.key === 'ArrowRight' && hasNext) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, hasPrev, hasNext, onClose, onIndex]);

  // Stop the page behind the overlay scrolling under your finger.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Warm the neighbours so arrowing through feels instant.
  useEffect(() => {
    [index - 1, index + 1].forEach(i => {
      if (photos[i]) new Image().src = `/api/photos/${photos[i].id}`;
    });
  }, [index, photos]);

  const touchStart = useRef(null);
  const handleTouchEnd = (e) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx > 0 && hasPrev) onIndex(index - 1);
    else if (dx < 0 && hasNext) onIndex(index + 1);
  };

  const photo = photos[index];
  if (!photo) return null;
  const dayMeta = DAYS.find(d => d.num === photo.dayNum);
  const stop = e => e.stopPropagation();
  const arrowStyle = { background: "rgba(245, 239, 224, 0.14)", color: "var(--cream)" };

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ background: "rgba(15, 22, 19, 0.95)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}>
        <span className="text-[11px] uppercase tracking-widest" style={{ color: "rgba(245, 239, 224, 0.65)" }}>
          {index + 1} of {photos.length}
        </span>
        <div className="flex items-center gap-1" onClick={stop}>
          {canEdit && onDelete && (
            <button
              onClick={() => { if (confirmDelete(photo, onDelete)) onClose(); }}
              aria-label="Delete photo"
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ color: "rgba(245, 239, 224, 0.8)" }}
            >
              <Trash2 size={17} />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ color: "var(--cream)" }}
          >
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center px-3 relative">
        {hasPrev && (
          <button
            onClick={e => { stop(e); onIndex(index - 1); }}
            aria-label="Previous photo"
            className="absolute left-2 z-10 w-11 h-11 rounded-full flex items-center justify-center"
            style={arrowStyle}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <img
          src={`/api/photos/${photo.id}`}
          alt={photo.caption || `Day ${photo.dayNum}`}
          onClick={stop}
          className="max-h-full max-w-full object-contain rounded"
        />
        {hasNext && (
          <button
            onClick={e => { stop(e); onIndex(index + 1); }}
            aria-label="Next photo"
            className="absolute right-2 z-10 w-11 h-11 rounded-full flex items-center justify-center"
            style={arrowStyle}
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className="flex-shrink-0 px-5 py-4 text-center" style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }} onClick={stop}>
        <p className="font-serif text-base" style={{ color: "var(--cream)" }}>
          Day {photo.dayNum}{dayMeta ? ` · ${dayMeta.title}` : ''}
        </p>
        {photo.caption && (
          <p className="text-sm mt-1" style={{ color: "rgba(245, 239, 224, 0.72)" }}>{photo.caption}</p>
        )}
      </div>
    </div>
  );
}

function PhotoThumb({ photo, canEdit, onDelete, onOpen, size = "h-24 w-24" }) {
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    confirmDelete(photo, onDelete);
  };
  return (
    <div className="relative">
      <button onClick={onOpen} className="block w-full" aria-label={photo.caption || `Photo from day ${photo.dayNum}`}>
        <img src={`/api/photos/${photo.id}`} alt={photo.caption || ''} loading="lazy" className={`rounded ${size} object-cover border`} style={{ borderColor: "var(--line)" }} />
      </button>
      {canEdit && onDelete && (
        <button
          onClick={handleDelete}
          aria-label="Delete photo"
          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "rgba(31, 45, 39, 0.75)", color: "var(--cream)" }}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

function PhotoStrip({ photos, canEdit, onDelete }) {
  const openLightbox = useContext(LightboxContext);
  if (!photos || !photos.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {photos.map((p, i) => (
        <div key={p.id} className="w-24">
          <PhotoThumb photo={p} canEdit={canEdit} onDelete={onDelete} onOpen={() => openLightbox(photos, i)} />
          {p.caption && <p className="text-[10px] mt-1 truncate" style={{ color: "var(--slate)" }}>{p.caption}</p>}
        </div>
      ))}
    </div>
  );
}

function PhotoUploadButton({ dayNum, stopIndex, upload, uploading }) {
  const inputRef = useRef(null);
  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const caption = window.prompt('Caption (optional)') || '';
    try {
      await upload(file, { dayNum, stopIndex, caption });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };
  return (
    <>
      {/* No capture attribute: it would force the in-browser camera, and photos
          taken that way carry no GPS. Letting iOS offer the library keeps it. */}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handle} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs inline-flex items-center gap-1 hover:underline disabled:opacity-50" style={{ color: "var(--accent)" }}>
        <Camera size={11} />{uploading ? 'Uploading…' : 'Add photo'}
      </button>
    </>
  );
}

function StopRow({ stop, isLast, dayNum, stopIndex, photos, canEdit, upload, uploading, remove }) {
  const meta = STOP_META[stop.type];
  const Icon = meta.icon;
  return (
    <div className="flex gap-3 relative">
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-[1px]" style={{ background: "var(--line)" }} />}
      <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: meta.color }}>
        <Icon size={15} color="var(--cream)" strokeWidth={2.2} />
      </div>
      <div className="flex-1 pb-5">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xs font-mono tracking-tight" style={{ color: "var(--slate)" }}>{stop.time}</span>
          <h4 className="font-serif text-base font-medium" style={{ color: "var(--ink)" }}>{stop.name}</h4>
          {stop.optional && <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--slate)" }}>optional</span>}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "var(--slate)" }}>{stop.loc}</p>
        {stop.notes && <p className="text-sm mt-1.5 leading-snug" style={{ color: "var(--ink)" }}>{stop.notes}</p>}
        <div className="flex flex-wrap gap-3 mt-2 items-center">
          {stop.booking && <StatusBadge booked={false} urgency={BOOKING_META[stop.booking]?.urgency} />}
          {stop.phone && <a href={`tel:${stop.phone.replace(/\s/g, '')}`} className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><Phone size={11} />{stop.phone}</a>}
          {stop.link && <a href={stop.link} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><ExternalLink size={11} />Website</a>}
          {canEdit && <PhotoUploadButton dayNum={dayNum} stopIndex={stopIndex} upload={upload} uploading={uploading} />}
        </div>
        <PhotoStrip photos={photos} canEdit={canEdit} onDelete={remove} />
      </div>
    </div>
  );
}

function DayCard({ day, open, onToggle, photos, canEdit, upload, uploading, remove }) {
  const ref = useRef(null);
  const handleToggle = () => {
    const willOpen = !open;
    onToggle();
    if (willOpen) {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };
  return (
    <article ref={ref} className="border-t" style={{ borderColor: "var(--line)" }}>
      <button onClick={handleToggle} className="w-full text-left py-5 px-1 flex items-start gap-4 hover:opacity-80 transition-opacity">
        <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-serif text-xl" style={{ background: "var(--ink)", color: "var(--cream)" }}>
          {day.num}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-widest font-medium" style={{ color: "var(--slate)" }}>{day.date}</span>
          </div>
          <h3 className="font-serif text-xl md:text-2xl leading-tight mt-0.5" style={{ color: "var(--ink)" }}>{day.title}</h3>
          <p className="text-sm mt-1.5 leading-snug" style={{ color: "var(--slate)" }}>{day.blurb}</p>
          <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--slate)" }}>
            <span className="inline-flex items-center gap-1"><Car size={12} />{day.drive.miles} mi · {day.drive.hrs}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={12} />{day.stops.length} stop{day.stops.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex-shrink-0 pt-2">
          {open ? <ChevronDown size={20} style={{ color: "var(--slate)" }} /> : <ChevronRight size={20} style={{ color: "var(--slate)" }} />}
        </div>
      </button>
      {open && (
        <div className="pb-6 pl-1">
          <div className="ml-16 mb-5">
            <a href={day.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-colors" style={{ background: "var(--ink)", color: "var(--cream)" }}>
              <Navigation size={14} />
              Open day {day.num} in Google Maps
            </a>
          </div>
          <div className="ml-16">
            {day.stops.map((s, i) => (
              <StopRow
                key={i}
                stop={s}
                isLast={i === day.stops.length - 1}
                dayNum={day.num}
                stopIndex={i}
                photos={photos?.filter(p => p.stopIndex === i)}
                canEdit={canEdit}
                upload={upload}
                uploading={uploading}
                remove={remove}
              />
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function RouteMap({ checkin }) {
  const [home] = useState(project(HOME.lat, HOME.lng));
  const overnights = useMemo(() => OVERNIGHT_COORDS.map(o => ({ ...o, xy: project(o.lat, o.lng) })), []);
  // Deduplicate consecutive same locations (Cwellyn nights 2 & 3)
  const routePath = useMemo(() => {
    const pts = [home, ...overnights.map(o => o.xy), home];
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  }, [home, overnights]);

  // Off-map coordinates would clamp to an edge and read as a real position, so
  // drop the dot entirely rather than draw it somewhere untrue.
  const checkinXY = useMemo(() => {
    if (!checkin || !withinMap(checkin)) return null;
    return project(checkin.lat, checkin.lng);
  }, [checkin]);

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "var(--stone)" }}>
      <svg viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grain" patternUnits="userSpaceOnUse" width="3" height="3">
            <rect width="3" height="3" fill="var(--stone)" />
            <circle cx="1.5" cy="1.5" r="0.3" fill="var(--ink)" opacity="0.08" />
          </pattern>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--rust)" />
          </marker>
        </defs>
        <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#grain)" />

        {/* Compass + decorative elements */}
        <g transform="translate(440, 50)" opacity="0.55">
          <circle r="22" fill="none" stroke="var(--ink)" strokeWidth="0.6" />
          <text textAnchor="middle" y="-26" className="font-serif" fontSize="9" fill="var(--ink)" letterSpacing="2">N</text>
          <path d="M0,-18 L4,0 L0,3 L-4,0 Z" fill="var(--ink)" />
          <path d="M0,18 L4,0 L0,-3 L-4,0 Z" fill="var(--ink)" opacity="0.3" />
        </g>

        {/* Subtle coordinate ticks */}
        <g opacity="0.25" fontSize="6" fontFamily="monospace" fill="var(--slate)">
          <text x="10" y="20">53°N</text>
          <text x="10" y={VIEWBOX.h - 8}>52°N</text>
        </g>

        {/* Route path */}
        <path d={routePath} fill="none" stroke="var(--rust)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 4" opacity="0.85" />

        {/* Last check-in. Deliberately drawn beneath the markers: checking in
            at a campsite is the normal case, and this way the pulse haloes the
            night's marker instead of hiding its number. */}
        {checkinXY && (
          <g transform={`translate(${checkinXY[0]}, ${checkinXY[1]})`}>
            <circle r="6" fill="var(--rust)" opacity="0.45">
              <animate attributeName="r" values="7;24;7" dur="2.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle r="13" fill="var(--rust)" opacity="0.18" />
            <circle r="6" fill="var(--rust)" stroke="var(--cream)" strokeWidth="1.5" />
          </g>
        )}

        {/* Home marker */}
        <g transform={`translate(${home[0]}, ${home[1]})`}>
          <circle r="9" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.5" />
          <circle r="3" fill="var(--ink)" />
          <text x="13" y="-8" className="font-serif" fontSize="11" fill="var(--ink)" fontWeight="500">Follifoot</text>
          <text x="13" y="3" fontSize="7.5" fill="var(--slate)" letterSpacing="1">START · END</text>
        </g>

        {/* Overnight markers */}
        {overnights.map((o, i) => {
          // Skip rendering label for duplicate Cwellyn (day 3) but keep the dot
          const isDup = i > 0 && overnights[i - 1].name === o.name;
          // Label positioning - offset to avoid overlap
          const labelOffsets = {
            "Erw Glas": { x: 14, y: 4 },
            "Snowdon BC": { x: -8, y: 16 },
            "Bennar Beach": { x: -72, y: 4 },
            "Llanrhystud": { x: -74, y: 4 },
            "Mwnt": { x: -38, y: 4 },
            "Porthclais": { x: -58, y: 4 },
            "Pencelli": { x: 12, y: 4 }
          };
          const off = labelOffsets[o.name] || { x: 12, y: 4 };
          return (
            <g key={i} transform={`translate(${o.xy[0]}, ${o.xy[1]})`}>
              {!isDup && (
                <>
                  <circle r="11" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="3.5" className="font-serif" fontSize="11" fontWeight="600" fill="var(--ink)">{o.day}</text>
                  <text x={off.x} y={off.y} fontSize="9" fill="var(--ink)" fontWeight="500">{o.name}</text>
                </>
              )}
              {isDup && (
                <>
                  <circle r="6" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.5" />
                  <text textAnchor="middle" dy="2.5" fontSize="7" fontWeight="600" fill="var(--ink)">{o.day}</text>
                </>
              )}
            </g>
          );
        })}

        {/* Title in corner */}
        <g transform="translate(20, 545)" opacity="0.7">
          <text fontSize="7" fill="var(--slate)" letterSpacing="2" fontFamily="monospace">~950 MI · 9 DAYS · 8 NIGHTS</text>
        </g>
      </svg>
    </div>
  );
}

function relativeTime(ms) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

// Describes a check-in by the nearest overnight stop when there is one, since
// "near Porthclais" means more to someone following along than coordinates.
function describeCheckin(checkin) {
  const nearest = nearestOvernight({ lat: checkin.lat, lng: checkin.lng }, 25);
  const when = relativeTime(checkin.at);
  return nearest ? `Near ${nearest.name} · ${when}` : `Checked in ${when}`;
}

function CheckInPanel({ checkin, checkIn, clearCheckin, busy, canEdit }) {
  const [error, setError] = useState(null);

  const handleCheckIn = async () => {
    setError(null);
    try {
      await checkIn();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Remove the check-in pin from the map?')) return;
    setError(null);
    try {
      await clearCheckin();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!canEdit && !checkin) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          {checkin ? (
            <p className="text-xs inline-flex items-center gap-1.5" style={{ color: "var(--ink)" }}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--rust)" }} />
              {describeCheckin(checkin)}
              {!withinMap(checkin) && <span style={{ color: "var(--slate)" }}>(off the map)</span>}
            </p>
          ) : (
            <p className="text-xs" style={{ color: "var(--slate)" }}>No check-in yet</p>
          )}
        </div>
        {canEdit && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {checkin && (
              <button onClick={handleClear} disabled={busy} className="text-xs hover:underline disabled:opacity-50" style={{ color: "var(--slate)" }}>
                Clear
              </button>
            )}
            <button
              onClick={handleCheckIn}
              disabled={busy}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 disabled:opacity-60"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              <MapPin size={12} />
              {busy ? 'Locating…' : checkin ? 'Check in again' : 'Check in here'}
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-[11px] mt-2" style={{ color: "var(--rust)" }}>{error}</p>}
    </div>
  );
}

function PackingList() {
  const [packed, setPacked] = useSharedState('packing', {});

  const groups = [
    {
      title: "Van handover with James",
      items: [
        { id: "ehu-confirm", name: "Confirm EHU cable is in the van", note: "Critical — van has NO solar/off-grid capability, so every campsite stop needs mains hookup. Confirm cable supplied and where stored." },
        { id: "carplay-cable", name: "USB-C cable for Apple CarPlay", note: "T6.1 Californias have CarPlay/Android Auto as standard — plug phone in, tap 'App' on the head unit, Google Maps/Waze displays on the dash. Wired only (no wireless CarPlay on the base head unit). USB-C-to-Lightning (older iPhones) or USB-C-to-USB-C (iPhone 15+)." }
      ]
    },
    {
      title: "Bedding & towels",
      items: [
        { id: "linens-van", name: "Bedding for the in-van beds", note: "Van has NO linens. Sheets, pillows, duvets for Dom + 2 of the kids (3 sleeping in the van, Mylo in tent). Sleeping bags also work and pack smaller." },
        { id: "towels-van", name: "Bath/shower towels × 4", note: "Van has NO towels. One per person for campsite showers. Microfibre dries fastest." }
      ]
    },
    {
      title: "BBQ & cooking",
      items: [
        { id: "grill", name: "Borrow BBQ from Barry & George", note: "Must be raised off the grass — required at Bennar Beach, Llanrhystud, Porthclais, Pencelli. Check the BBQ meets the height rule before loading." },
        { id: "charcoal", name: "4 × Instant Light Charcoal Bags from The Range", note: "Single-use bags — just light the corner, no firelighters or arranging needed. One per BBQ night: Bennar Beach (Tue), Llanrhystud (Wed), Mwnt (Thu), Porthclais (Fri). Saturday is pub dinner at the Royal Oak. NB Snowdon Base Camp Sun + Mon use their kiln-dried logs only (£7/bag at the pub), NOT charcoal." },
        { id: "firelighters", name: "Long matches or wind-proof lighter", note: "For lighting the instant-light bags and the kiln-dried logs at Snowdon Base Camp. Welsh evenings get breezy — wind-proof lighter is the reliable choice." },
        { id: "tongs", name: "Long-handled tongs + heatproof gloves", note: "Cooking over wood and embers — longer reach needed." },
        { id: "foil", name: "Heavy-duty foil + kitchen roll", note: "Foil-wrapped jacket potatoes in the embers = winner with kids." },
        { id: "coolbox", name: "Cool box + ice packs", note: "Van has fridge but NO freezer. Cool box handy for keeping BBQ meat cold or holding overflow — useful for the off-grid night at Porthclais (no EHU)." },
        { id: "chairs", name: "4 × folding camp chairs", note: "One each for evenings at the pitch and BBQ nights. Light enough to carry over the boardwalk at Bennar Beach for the ~9pm sunset over Cardigan Bay." }
      ]
    },
    {
      title: "Mylo's tent",
      items: [
        { id: "tent", name: "2-3 person tent", note: "Pitches alongside the van — Mylo's own space." },
        { id: "sleepbag", name: "Sleeping bag + mat", note: "Van linens cover the in-van beds, but Mylo's tent needs its own. 3-season bag — Welsh nights can drop to 8°C even in August." },
        { id: "pillow", name: "Camp pillow", note: "Inflatable or stuff-sack style — squashes into the van for transport." },
        { id: "headtorch", name: "Headtorch", note: "For the walk from tent to facilities at night." }
      ]
    },
    {
      title: "Walking & weather",
      items: [
        { id: "waterproofs", name: "Waterproof jackets × 4", note: "Non-negotiable even in August — Wales averages 12 wet days a month in summer." },
        { id: "boots", name: "Walking boots × 4", note: "For Pen-y-Fan, Llyn Idwal, coastal paths." },
        { id: "layers", name: "Fleece or long-sleeve top × 4", note: "Mountain spots (Llyn Idwal, Pen-y-Fan) and Brecon evenings can be chilly even in August." },
        { id: "socks", name: "Twice as many socks as you think", note: "Wet socks are the kid-trip killer." }
      ]
    },
    {
      title: "Beach & swim",
      items: [
        { id: "swimwear", name: "Swimwear × 4 + rash vests for kids", note: "3 prime beach days: Bennar Beach (Tue), Mwnt (Thu), St Davids beaches (Fri — Caerfai Bay / Whitesands nearby). Welsh sea is cold — rash vests extend beach time for Mason + Harper." },
        { id: "towels", name: "Beach towels × 4", note: "Separate from the bath/shower towels — beach use means sand and salt water. Quick-dry microfibre saves van space." },
        { id: "sun", name: "Factor 50 sun cream + after-sun", note: "Welsh sun is sneaky — kids burn on overcast days." }
      ]
    },
    {
      title: "Kids' kit",
      items: [
        { id: "booster", name: "Mason's car seat", note: "Britax Kidfix i-Size from the iX3 — install in one of the van's ISOFIX points." },
        { id: "tablets", name: "Switch + iPad + chargers", note: "iPad needs fixing before the trip. Pre-download Switch games and iPad shows for offline use — Day 1 and Day 9 are 3-5 hour drives with patchy signal." },
        { id: "snacks", name: "Road snacks stash", note: "Veg sticks, oat bars, crisps — non-melting." },
        { id: "firstaid", name: "First aid kit + plasters", note: "Family-size pack." },
        { id: "books", name: "Books / activity packs", note: "Quiet-time options for non-screen periods." }
      ]
    },
    {
      title: "Documents & digital",
      items: [
        { id: "goboony", name: "Goboony booking confirmation + van docs", note: "Print + on phone. James needs to provide V5 / insurance / breakdown details at handover." },
        { id: "zipworld-conf", name: "Zip World booking confirmation", note: "Print + on phone for the morning of Sun 2 Aug." },
        { id: "campsite-confs", name: "All campsite confirmations", note: "Some sites are phone-only — write down the booking ref." },
        { id: "tides", name: "Tide times app", note: "Handy for the beach days — Bennar Beach (Tue), Mwnt (Thu), St Davids beaches (Fri). Check before swimming; low tide gives the widest sand." },
        { id: "maps", name: "Download offline Google Maps for Wales", note: "Big rural patches (Snowdonia, north Pembrokeshire, Brecon Beacons) have flaky phone signal — CarPlay won't help if Maps can't load. In the Google Maps app: Profile → Offline maps → Select your own map → drag the box to cover all of Wales + Shropshire. Do it on home WiFi (~500MB). OS Maps app is the alternative for walking routes." },
        { id: "cadw", name: "Cadw Explorer Pass (7-day family)", note: "~£44 family pass covers Conwy Castle (Day 2) + Harlech Castle (Day 5) + Bishop's Palace at St Davids (Day 7 if you fancy it). On-the-door price for Conwy + Harlech alone is ~£74, so the pass saves ~£30. Buy it at Conwy reception on Day 2." }
      ]
    },
    {
      title: "Buy on the way",
      items: [
        { id: "bigshop1", name: "Big shop near Llandudno (Day 1 evening or Day 2 morning)", note: "Asda Llandudno or Sainsbury's Llandudno Junction. Stock up for 3-4 days." },
        { id: "bbqfood", name: "BBQ food for Cwellyn", note: "Burgers, sausages, marshmallows, jacket potatoes, halloumi." },
        { id: "logs", name: "Logs at Cwellyn pub on arrival", note: "£7/bag kiln-dried. No bringing your own wood." },
        { id: "bigshop2", name: "Top-up shop in Aberystwyth (Day 5)", note: "Morrisons or Tesco — for the back half of the trip." }
      ]
    }
  ];

  const allItems = groups.flatMap(g => g.items);
  const done = allItems.filter(it => packed[it.id]).length;

  return (
    <div>
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <h2 className="font-serif text-2xl md:text-3xl" style={{ color: "var(--ink)" }}>Before you go</h2>
        <span className="text-sm" style={{ color: "var(--slate)" }}>{done} of {allItems.length} packed</span>
      </div>
      <div className="w-full h-1 rounded-full mb-8 overflow-hidden" style={{ background: "var(--stone)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(done / allItems.length) * 100}%`, background: "var(--green)" }} />
      </div>

      {groups.map((group, gi) => (
        <div key={gi} className="mb-7">
          <h3 className="font-serif text-lg mb-3 pb-1.5 border-b" style={{ color: "var(--ink)", borderColor: "var(--line)" }}>
            {group.title}
          </h3>
          <ul className="space-y-2">
            {group.items.map(it => {
              const isPacked = packed[it.id];
              return (
                <li key={it.id} className="flex items-start gap-3 py-1.5">
                  <button onClick={() => setPacked(p => ({ ...p, [it.id]: !p[it.id] }))} className="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5" style={{ borderColor: isPacked ? "var(--green)" : "var(--line)", background: isPacked ? "var(--green)" : "transparent" }}>
                    {isPacked && <Check size={12} color="var(--cream)" strokeWidth={3} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--ink)", textDecoration: isPacked ? "line-through" : "none", opacity: isPacked ? 0.55 : 1 }}>
                      {it.name}
                    </div>
                    {it.note && <div className="text-xs mt-0.5" style={{ color: "var(--slate)", opacity: isPacked ? 0.55 : 1 }}>{it.note}</div>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function BookingsList() {
  const [bookings, setBookings] = useSharedState('bookings', {
    james: false, zipworld: true, porthclais: true, newquayboats: true, mwnt: true, pencelli: true, royaloak: true,
    cwellyn: true, erwglas: true, pengarreg: true, bennar: true, cornmill: true, conwy: false
  });

  const items = [
    { id: "james", name: "Pay James — £100 van extension", urgency: "high", date: "Before 1 Aug", note: "£50 early pickup (Sat 1 Aug) + £50 late return (Sun 9 Aug). Pay via Goboony." },
    { id: "zipworld", name: "Zip World Betws-y-Coed — Fforest Coaster", urgency: "critical", date: "Sun 2 Aug ~12:30", link: "https://www.zipworld.co.uk/adventure/fforest-coaster", note: "BOOKED ✓ £121.40 · booking 03497811. Arrive 12:00, start 12:30. Parking incl. (Betws-y-Coed 8h). Waivers signed online for all 4 ✓." },
    { id: "porthclais", name: "Porthclais Farm, St Davids", urgency: "high", date: "Fri 7 Aug", phone: "07970 439310", link: "https://porthclaiscampsite.co.uk/", note: "BOOKED ✓ £25 · receipt 1942-6801. Single Friday night, camper van pitch. No electric hook-up (the trip's off-grid night)." },
    { id: "newquayboats", name: "New Quay Boat Trips — Dolphin Spotting", urgency: "critical", date: "Thu 6 Aug 11:30", phone: "01545 560800", link: "https://www.newquayboattrips.co.uk/", note: "BOOKED ✓ £60 · booking 2551605217732353. 1-hour trip on Dreamcatcher, 2 adults + 2 children. Arrive by 11:10." },
    { id: "mwnt", name: "Tŷ Gwyn, Mwnt", urgency: "high", date: "Thu 6 Aug", phone: "01239 614518", link: "https://campingatmwnt.com/", note: "BOOKED ✓ £34 · 1 night with electric hook-up (Davina/Huw confirmed by email)." },
    { id: "pencelli", name: "Pencelli Castle, Brecon", urgency: "high", date: "Sat 8 Aug", phone: "01874 665451", link: "http://www.pencelli-castle.com/", note: "BOOKED ✓ £56 · booking 10599542. The Oaks — grass standing pitch with electric. Report to reception on arrival." },
    { id: "royaloak", name: "Royal Oak Inn, Pencelli — last-night dinner", urgency: "high", date: "Sat 8 Aug ~19:00", phone: "01874 665396", link: "https://www.facebook.com/TheRoyalOakPencelli/", note: "BOOKED ✓ table by phone. 100m walk from the campsite. Kitchen stops at 8pm — aim for 7pm." },
    { id: "cwellyn", name: "Snowdon Base Camp, Rhyd-Ddu (2 nights)", urgency: "high", date: "Sun 2 + Mon 3 Aug", phone: "01766 890321", link: "http://www.snowdoninn.co.uk/", note: "BOOKED ✓ £135 · ref CA/9737/10514. Hardstanding EHU pitch, 2 nights (arr 02/08, dep 04/08). Check in at the Cwellyn Arms pub." },
    { id: "erwglas", name: "Erw Glas, Maenan", urgency: "high", date: "Sat 1 Aug", phone: "01492 702486", link: "https://www.erwglasglampingandcamping.co.uk/", note: "BOOKED ✓ £28 · ref WTB1A5AD09. Small campervan pitch (13:00–15:15 arrival window). Confirm EHU + pre-order pizza/breakfast hamper. Update car reg." },
    { id: "pengarreg", name: "Pengarreg, Llanrhystud", urgency: "high", date: "Wed 5 Aug", phone: "01974 202247", link: "https://pengarregcaravanpark.co.uk/", note: "BOOKED ✓ £32 · ref PCP/5699/8014. Touring + camping electric, 1 night. Occupancy logged as 1 adult + 3 children. Update car reg." },
    { id: "bennar", name: "Bennar Beach, Dyffryn Ardudwy", urgency: "high", date: "Tue 4 Aug", phone: "01341 247001", link: "https://www.bennar.co.uk/", note: "BOOKED ✓ £40 · booking 5826, pitch 101 (electric). Arrive after 13:00. Shower block code 1524, bring £1 coins. Site asked for car reg — update it." },
    { id: "cornmill", name: "The Corn Mill, Llangollen — lunch table", urgency: "low", date: "Sat 1 Aug 13:00–15:15", link: "https://www.cornmill-llangollen.co.uk/", note: "BOOKED ✓ table for 4 (Indoor bookable). Riverside table over the Dee." },
    { id: "conwy", name: "Conwy Castle / Cadw Explorer Pass", urgency: "low", date: "Sun 2 Aug", link: "https://cadw.gov.wales/visit/places-to-visit/conwy-castle", note: "Buy the 7-day Explorer Pass at Conwy reception on the day — covers Conwy + Harlech + Bishop's Palace for the whole trip." }
  ];

  const done = Object.values(bookings).filter(Boolean).length;
  return (
    <div>
      <div className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <h2 className="font-serif text-2xl md:text-3xl" style={{ color: "var(--ink)" }}>Bookings to make</h2>
        <span className="text-sm" style={{ color: "var(--slate)" }}>{done} of {items.length} done</span>
      </div>
      <div className="w-full h-1 rounded-full mb-6 overflow-hidden" style={{ background: "var(--stone)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(done / items.length) * 100}%`, background: "var(--green)" }} />
      </div>
      <ul className="space-y-2">
        {items.map(it => {
          const isDone = bookings[it.id];
          const urgencyColor = it.urgency === "critical" ? "var(--rust)" : it.urgency === "high" ? "var(--accent)" : "var(--slate)";
          return (
            <li key={it.id} className="rounded-lg p-4 flex items-start gap-3 transition-all" style={{ background: isDone ? "var(--stone)" : "var(--cream)", border: "1px solid var(--line)", opacity: isDone ? 0.55 : 1 }}>
              <button onClick={() => setBookings(b => ({ ...b, [it.id]: !b[it.id] }))} className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors mt-0.5" style={{ borderColor: isDone ? "var(--green)" : "var(--line)", background: isDone ? "var(--green)" : "transparent" }}>
                {isDone && <Check size={14} color="var(--cream)" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h4 className="font-serif text-base font-medium" style={{ color: "var(--ink)", textDecoration: isDone ? "line-through" : "none" }}>{it.name}</h4>
                  {!isDone && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0" style={{ background: urgencyColor, color: "var(--cream)" }}>{it.urgency === "critical" ? "Now" : it.urgency === "high" ? "This week" : "Anytime"}</span>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--slate)" }}>{it.date}</p>
                {it.note && <p className="text-xs mt-1.5 italic" style={{ color: "var(--slate)" }}>{it.note}</p>}
                <div className="flex flex-wrap gap-3 mt-2">
                  {it.phone && <a href={`tel:${it.phone.replace(/\s/g, '')}`} className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><Phone size={11} />{it.phone}</a>}
                  {it.link && <a href={it.link} target="_blank" rel="noopener noreferrer" className="text-xs inline-flex items-center gap-1 hover:underline" style={{ color: "var(--accent)" }}><ExternalLink size={11} />Book online</a>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TABS = ['route', 'bookings', 'todo', 'photos'];

function tabFromPath() {
  const seg = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return TABS.includes(seg) ? seg : 'route';
}

// Each tab is a real URL, so a refresh keeps you where you were, back/forward
// work, and you can send someone straight to the packing list.
function useTabRoute() {
  const [tab, setTab] = useState(tabFromPath);

  useEffect(() => {
    const onPop = () => setTab(tabFromPath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((next) => {
    setTab(next);
    const path = next === 'route' ? '/' : `/${next}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ tab: next }, '', path);
    }
  }, []);

  return [tab, navigate];
}

// A destination shouldn't rename itself based on whether you're unlocked.
const NAV_TABS = [
  { id: 'route', label: 'Route', icon: Navigation },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'todo', label: 'To do', icon: Check },
  { id: 'photos', label: 'Photos', icon: Camera },
];

function BottomNav({ active, onChange }) {
  const tabs = NAV_TABS;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur" style={{ background: "rgba(245, 239, 224, 0.92)", borderColor: "var(--line)", paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
      <div className="max-w-2xl mx-auto flex">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="flex-1 flex flex-col items-center py-2.5 transition-colors"
              style={{ color: isActive ? "var(--rust)" : "var(--slate)" }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              <span className="text-[10px] mt-1 uppercase tracking-wider font-semibold">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Trip runs 1–9 Aug 2026. Day N = Aug N.
const TRIP_YEAR = 2026;
const TRIP_MONTH_IDX = 7; // August (0-indexed)

function tripDayFor(date = new Date()) {
  if (date.getFullYear() !== TRIP_YEAR || date.getMonth() !== TRIP_MONTH_IDX) return null;
  const d = date.getDate();
  return d >= 1 && d <= 9 ? d : null;
}

function distanceKm(a, b) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function nearestOvernight(loc, thresholdKm = 60) {
  let best = null;
  for (const o of OVERNIGHT_COORDS) {
    const d = distanceKm(loc, o);
    if (d < thresholdKm && (!best || d < best.d)) best = { ...o, d };
  }
  return best;
}

const DAY_MONTH = { day: 'numeric', month: 'short' };

// Works out which trip day a photo belongs to, best evidence first: the EXIF
// capture date, then EXIF GPS, then the file's own modified date, then today.
// EXIF outranks lastModified because it travels with the image, whereas a
// modified date can be reset by copying — but in practice iOS strips EXIF on
// the way into a file input, so lastModified is usually what we get to use.
// Returns null when nothing lines up, leaving the manual picker alone.
function inferDay(exif = {}, file = null) {
  const taken = exif.takenAt ? tripDayFor(exif.takenAt) : null;
  const nearest = exif.lat != null ? nearestOvernight({ lat: exif.lat, lng: exif.lng }) : null;

  if (taken && nearest) {
    return taken === nearest.day
      ? { day: taken, hint: `Taken on Day ${taken} · near ${nearest.name}` }
      : { day: taken, hint: `Taken on Day ${taken} (nearest stop is Day ${nearest.day}'s ${nearest.name})` };
  }
  if (taken) return { day: taken, hint: `Taken on Day ${taken}` };
  if (nearest) return { day: nearest.day, hint: `Near ${nearest.name} · Day ${nearest.day}` };

  if (file?.lastModified) {
    const modified = new Date(file.lastModified);
    const day = tripDayFor(modified);
    if (day) {
      return { day, hint: `Photo dated ${modified.toLocaleDateString('en-GB', DAY_MONTH)} · Day ${day}` };
    }
  }

  const today = tripDayFor();
  return today ? { day: today, hint: `No date in the photo · today is Day ${today}` } : null;
}

function PasswordPanel({ hasPassword, setPassword }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError(null);
    const result = await setPassword(value);
    setChecking(false);
    if (result.ok) {
      setOpen(false);
      setValue('');
    } else {
      setError(result.error);
    }
  };

  const lock = async () => {
    await setPassword('');
    setOpen(false);
    setValue('');
    setError(null);
  };

  return (
    <div className="mb-6 p-3 rounded-lg" style={{ background: hasPassword ? "var(--stone)" : "rgba(185, 84, 47, 0.12)", border: "1px solid var(--line)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {hasPassword
            ? <Unlock size={14} style={{ color: "var(--green)" }} />
            : <Lock size={14} style={{ color: "var(--rust)" }} />}
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>
              {hasPassword ? 'Unlocked · you can add and delete photos' : 'Got the trip password? Unlock to add photos'}
            </p>
          </div>
        </div>
        <button
          onClick={hasPassword ? lock : () => setOpen(o => !o)}
          className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {hasPassword ? 'Lock' : (open ? 'Cancel' : 'Unlock')}
        </button>
      </div>

      {!hasPassword && open && (
        <form onSubmit={submit} className="flex gap-2 mt-3">
          {/* A plain visible field, not window.prompt: phone keyboards
              autocapitalise prompts and silently break the password. */}
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(null); }}
            placeholder="Trip password"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 min-w-0 p-2.5 rounded-md"
            style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--ink)" }}
          />
          <button
            type="submit"
            disabled={checking || !value.trim()}
            className="px-4 py-2.5 rounded-md text-sm font-medium flex-shrink-0 disabled:opacity-50"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            {checking ? '…' : 'Go'}
          </button>
        </form>
      )}
      {error && (
        <p className="text-[11px] mt-2" style={{ color: "var(--rust)" }}>{error}</p>
      )}
    </div>
  );
}

// What the browser actually handed over, so a photo that files itself on the
// wrong day is explainable rather than mysterious.
function describeSource({ file, exif }) {
  const mb = (file.size / 1048576).toFixed(1);
  const found = [exif.takenAt && 'date', exif.lat != null && 'location'].filter(Boolean);
  return `${exif.format || '?'} · ${mb} MB · ${found.length ? found.join(' + ') : 'no metadata'}`;
}

// Review step shown between picking a photo and uploading it. The day is
// already worked out; this just shows the answer and offers a way to correct it.
function PendingUpload({ pending, onChangeDay, onCaption, onConfirm, onCancel, uploading }) {
  // An unresolved day is the one case worth asking about up front.
  const [showPicker, setShowPicker] = useState(!pending.hint);
  const previewUrl = useMemo(() => URL.createObjectURL(pending.file), [pending.file]);
  useEffect(() => () => URL.revokeObjectURL(previewUrl), [previewUrl]);
  const dayMeta = DAYS.find(d => d.num === pending.day);

  return (
    <div className="mb-8 p-4 rounded-lg" style={{ background: "var(--stone)", border: "1px solid var(--line)" }}>
      <div className="flex gap-3">
        <img src={previewUrl} alt="" className="w-20 h-20 rounded object-cover flex-shrink-0 border" style={{ borderColor: "var(--line)" }} />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg leading-tight" style={{ color: "var(--ink)" }}>
            Day {pending.day}{dayMeta ? ` · ${dayMeta.title}` : ''}
          </p>
          <p className="text-[11px] mt-1 italic" style={{ color: "var(--slate)" }}>
            {pending.hint || "Couldn't read a date or place from this photo — pick a day."}
          </p>
          <p className="text-[10px] mt-1 font-mono" style={{ color: "var(--slate)" }}>
            {describeSource(pending)}
          </p>
          {!showPicker && (
            <button onClick={() => setShowPicker(true)} className="text-[11px] mt-1.5 hover:underline" style={{ color: "var(--accent)" }}>
              Wrong day?
            </button>
          )}
        </div>
      </div>

      {showPicker && (
        <select
          value={pending.day}
          onChange={e => onChangeDay(parseInt(e.target.value, 10))}
          className="w-full mt-3 p-2.5 rounded-md"
          style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--ink)" }}
        >
          {DAYS.map(d => <option key={d.num} value={d.num}>Day {d.num} · {d.date} · {d.title}</option>)}
        </select>
      )}

      <input
        type="text"
        value={pending.caption}
        onChange={e => onCaption(e.target.value)}
        placeholder="Caption (optional)"
        maxLength={280}
        className="w-full mt-3 p-2.5 rounded-md"
        style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--ink)" }}
      />

      <div className="flex gap-2 mt-3">
        <button
          onClick={onConfirm}
          disabled={uploading}
          className="flex-1 py-3 rounded-md font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          <Camera size={16} />
          {uploading ? 'Uploading…' : `Add to Day ${pending.day}`}
        </button>
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-3 rounded-md font-medium text-sm disabled:opacity-60"
          style={{ background: "var(--cream)", color: "var(--ink)", border: "1px solid var(--line)" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PhotoTab({ photos, upload, uploading, canEdit, remove, hasPassword, setPassword }) {
  const [pending, setPending] = useState(null);
  const inputRef = useRef(null);

  const handlePick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // The photo tells us the day; the picker below is only a correction.
    const exif = await readPhotoExif(file);
    const inferred = inferDay(exif, file);
    setPending({
      file,
      exif,
      caption: '',
      day: inferred?.day ?? tripDayFor() ?? 1,
      hint: inferred?.hint ?? null,
    });
  };

  const handleConfirm = async () => {
    const { file, exif, day, caption } = pending;
    try {
      await upload(file, {
        dayNum: day,
        stopIndex: null,
        caption,
        ...(exif.lat != null ? { lat: exif.lat, lng: exif.lng } : {}),
        ...(exif.takenAt ? { takenAt: exif.takenAt.getTime() } : {}),
        format: exif.format,
        magic: exif.magic,
      });
      setPending(null);
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };

  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl mb-5" style={{ color: "var(--ink)" }}>
        {canEdit ? 'Add a photo' : 'Journey log'}
      </h2>
      <PasswordPanel hasPassword={hasPassword} setPassword={setPassword} />
      {canEdit && (pending ? (
        <PendingUpload
          pending={pending}
          uploading={uploading}
          onChangeDay={day => setPending(p => ({ ...p, day }))}
          onCaption={caption => setPending(p => ({ ...p, caption }))}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      ) : (
        <div className="mb-8">
          {/* No capture attribute — see PhotoUploadButton. */}
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePick} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3.5 rounded-md font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            <Camera size={16} />
            {uploading ? 'Uploading…' : 'Take or choose a photo'}
          </button>
        </div>
      ))}
      {photos.length > 0 && (
        <h3 className="font-serif text-lg mb-4 pb-1.5 border-b" style={{ color: "var(--ink)", borderColor: "var(--line)" }}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </h3>
      )}
      <Gallery photos={photos} canEdit={canEdit} onDelete={remove} />
    </div>
  );
}

function Gallery({ photos, canEdit, onDelete }) {
  const openLightbox = useContext(LightboxContext);

  // One flat run in display order, so the lightbox arrows carry on across day
  // boundaries instead of dead-ending at the last photo of each group.
  const { groups, ordered } = useMemo(() => {
    const byDay = new Map();
    for (const p of photos) {
      if (!byDay.has(p.dayNum)) byDay.set(p.dayNum, []);
      byDay.get(p.dayNum).push(p);
    }
    const days = [...byDay.keys()].sort((a, b) => a - b);
    const g = days.map(day => ({
      day,
      items: [...byDay.get(day)].sort((a, b) => a.takenAt - b.takenAt),
    }));
    return { groups: g, ordered: g.flatMap(x => x.items) };
  }, [photos]);

  if (!photos.length) {
    return (
      <p className="text-sm italic" style={{ color: "var(--slate)" }}>
        No photos yet — they'll appear here once the trip starts.
      </p>
    );
  }

  let cursor = 0;
  return (
    <>
      {groups.map(({ day, items }) => {
        const dayMeta = DAYS.find(x => x.num === day);
        return (
          <div key={day} className="mb-7">
            <h3 className="font-serif text-lg mb-3 pb-1.5 border-b" style={{ color: "var(--ink)", borderColor: "var(--line)" }}>
              Day {day}{dayMeta ? ` · ${dayMeta.title}` : ''}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {items.map(p => {
                const at = cursor++;
                return (
                  <div key={p.id}>
                    <PhotoThumb photo={p} canEdit={canEdit} onDelete={onDelete} onOpen={() => openLightbox(ordered, at)} size="w-full aspect-square" />
                    {p.caption && <p className="text-[10px] mt-1 leading-tight" style={{ color: "var(--slate)" }}>{p.caption}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function App() {
  const [openDay, setOpenDay] = useState(1);
  const { photos, upload, uploading, remove } = usePhotos();
  const { checkin, checkIn, clearCheckin, busy: checkinBusy } = useCheckin();
  // The password is the only gate: everyone reads, password-holders contribute.
  const { hasPassword: canEdit, setPassword } = useAuth();
  const [tab, setTab] = useTabRoute();
  const [lightbox, setLightbox] = useState(null);

  const openLightbox = useCallback((list, index) => setLightbox({ list, index }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const moveLightbox = useCallback(index => setLightbox(lb => (lb ? { ...lb, index } : lb)), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);

  return (
    <LightboxContext.Provider value={openLightbox}>
    <div className="min-h-screen" style={{
      "--cream": "#f5efe0",
      "--stone": "#e8e0cc",
      "--ink": "#1f2d27",
      "--slate": "#6b746f",
      "--green": "#3a5c47",
      "--rust": "#b9542f",
      "--accent": "#7a5b3e",
      "--line": "rgba(31, 45, 39, 0.12)",
      background: "var(--cream)",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      color: "var(--ink)"
    }}>
      <div className="max-w-2xl mx-auto px-5 pt-8 md:pt-12 pb-28">

        {tab === 'route' && (
          <>
            <header className="mb-8">
              <p className="text-xs uppercase tracking-[0.3em] font-medium mb-3" style={{ color: "var(--rust)" }}>{TRIP.dates}</p>
              <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] mb-3" style={{ color: "var(--ink)" }}>
                {TRIP.title}
              </h1>
              <p className="font-serif italic text-lg md:text-xl leading-snug mb-6" style={{ color: "var(--slate)" }}>
                {TRIP.subtitle}
              </p>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm pb-6 border-b" style={{ borderColor: "var(--line)" }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--slate)" }}>Vehicle</p>
                  <p style={{ color: "var(--ink)" }}>{TRIP.vehicle}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--slate)" }}>Party</p>
                  <p style={{ color: "var(--ink)" }}>{TRIP.party}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--slate)" }}>Nights</p>
                  <p style={{ color: "var(--ink)" }}>8 in the van</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "var(--slate)" }}>Driving</p>
                  <p style={{ color: "var(--ink)" }}>{TRIP.totalMiles} mi · {TRIP.totalDrivingHrs}</p>
                </div>
              </div>
            </header>

            <section className="mb-10">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-serif text-2xl md:text-3xl" style={{ color: "var(--ink)" }}>The route</h2>
                <span className="text-xs uppercase tracking-widest" style={{ color: "var(--slate)" }}>Numbered by night</span>
              </div>
              <RouteMap checkin={checkin} />
              <div className="mt-3 flex items-center justify-center gap-4 text-xs flex-wrap" style={{ color: "var(--slate)" }}>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--ink)" }} />Overnight</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-6 h-[2px]" style={{ background: "var(--rust)", borderTop: "1px dashed" }} />Drive</span>
                {checkin && withinMap(checkin) && (
                  <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--rust)" }} />Last check-in</span>
                )}
              </div>
              <CheckInPanel checkin={checkin} checkIn={checkIn} clearCheckin={clearCheckin} busy={checkinBusy} canEdit={canEdit} />
              <div className="mt-4 text-center">
                <a href="https://www.google.com/maps/dir/?api=1&origin=Follifoot+HG3&destination=Follifoot+HG3&waypoints=Erw+Glas+Maenan+LL26+0YP%7CSnowdon+Base+Camp+Rhyd-Ddu+LL54+7YS%7CBennar+Beach+Dyffryn+Ardudwy+LL44+2RX%7CPengarreg+Caravan+Park+Llanrhystud+SY23+5DJ%7CTy+Gwyn+Caravan+and+Camping+Park+SA43+1QH%7CPorthclais+Farm+Campsite+SA62+6RR%7CPencelli+Castle+Caravan+%26+Camping+Park+LD3+7LX&travelmode=driving" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: "var(--accent)" }}>
                  <MapPin size={14} /> View full route in Google Maps
                </a>
              </div>
            </section>

            <section className="mb-4">
              <div className="flex items-baseline justify-between mb-2">
                <h2 className="font-serif text-2xl md:text-3xl" style={{ color: "var(--ink)" }}>Day by day</h2>
                <button onClick={() => setOpenDay(openDay === 'all' ? null : 'all')} className="text-xs uppercase tracking-widest hover:underline" style={{ color: "var(--accent)" }}>
                  {openDay === 'all' ? 'Collapse all' : 'Expand all'}
                </button>
              </div>
              <div>
                {DAYS.map(day => (
                  <DayCard
                    key={day.num}
                    day={day}
                    open={openDay === 'all' || openDay === day.num}
                    onToggle={() => setOpenDay(openDay === day.num ? null : day.num)}
                    photos={photos.filter(p => p.dayNum === day.num)}
                    canEdit={canEdit}
                    upload={upload}
                    uploading={uploading}
                    remove={remove}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === 'bookings' && <BookingsList />}

        {tab === 'todo' && <PackingList />}

        {tab === 'photos' && <PhotoTab photos={photos} upload={upload} uploading={uploading} canEdit={canEdit} remove={remove} hasPassword={canEdit} setPassword={setPassword} />}
      </div>

      <BottomNav active={tab} onChange={setTab} />

      {lightbox && (
        <Lightbox
          photos={lightbox.list}
          index={lightbox.index}
          onIndex={moveLightbox}
          onClose={closeLightbox}
          canEdit={canEdit}
          onDelete={remove}
        />
      )}
    </div>
    </LightboxContext.Provider>
  );
}
