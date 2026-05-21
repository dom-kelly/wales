import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapPin, Clock, Car, Bed, Utensils, Camera, Phone, ExternalLink, Check, X, Navigation, ChevronDown, ChevronRight, Calendar, Users, PoundSterling, AlertCircle, Mountain, Waves, Trees, Castle, Zap, ShoppingCart, Lock, Unlock } from 'lucide-react';
import { useSharedState, usePhotos, useAuth } from './api.js';

function isDriverMode() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('driver') === '1';
}

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
      { time: "11:30", type: "activity", name: "Dolphin-spotting boat trip", loc: "New Quay Main Pier", notes: "1-hour cruise with New Quay Boat Trips (Ermol VI) into the Cardigan Bay Special Area of Conservation — resident bottlenose dolphin pod, Atlantic grey seals, sea birds. £15 adult / £7.50 child (~£37.50 family of 4). PRE-BOOK — August trips sell out. Use the loo before boarding (no toilet on the 1-hour boats). Wrap up — windy at sea.", phone: "01545 560800", link: "https://www.newquayboattrips.co.uk/", booking: "urgent" },
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
      { time: "~19:00", type: "food", name: "Dinner at the Royal Oak Inn", loc: "Pencelli", notes: "Last-night sit-down dinner. Family-run pub 100m from the campsite entrance — canal-side beer garden, hearty home-cooked food, real ales. 4.5★, 884 reviews. Kitchen stops taking orders at 8pm — 7pm is safest. Saturday August will be busy — BOOK A TABLE.", phone: "01874 665396", link: "https://www.theroyaloakpencelli.com/", booking: "table" }
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

function PhotoThumb({ photo, isDriver, onDelete, size = "h-24 w-24" }) {
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const what = photo.caption ? `"${photo.caption}"` : 'this photo';
    if (window.confirm(`Delete ${what}? This can't be undone.`)) {
      onDelete?.(photo.id);
    }
  };
  return (
    <div className="relative">
      <a href={`/api/photos/${photo.id}`} target="_blank" rel="noopener noreferrer" className="block">
        <img src={`/api/photos/${photo.id}`} alt={photo.caption || ''} loading="lazy" className={`rounded ${size} object-cover border`} style={{ borderColor: "var(--line)" }} />
      </a>
      {isDriver && onDelete && (
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

function PhotoStrip({ photos, isDriver, onDelete }) {
  if (!photos || !photos.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {photos.map(p => (
        <div key={p.id} className="w-24">
          <PhotoThumb photo={p} isDriver={isDriver} onDelete={onDelete} />
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
      <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handle} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading} className="text-xs inline-flex items-center gap-1 hover:underline disabled:opacity-50" style={{ color: "var(--accent)" }}>
        <Camera size={11} />{uploading ? 'Uploading…' : 'Add photo'}
      </button>
    </>
  );
}

function StopRow({ stop, isLast, dayNum, stopIndex, photos, isDriver, upload, uploading, remove }) {
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
          {isDriver && <PhotoUploadButton dayNum={dayNum} stopIndex={stopIndex} upload={upload} uploading={uploading} />}
        </div>
        <PhotoStrip photos={photos} isDriver={isDriver} onDelete={remove} />
      </div>
    </div>
  );
}

function DayCard({ day, open, onToggle, photos, isDriver, upload, uploading, remove }) {
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
                isDriver={isDriver}
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

function RouteMap() {
  const [home] = useState(project(HOME.lat, HOME.lng));
  const overnights = useMemo(() => OVERNIGHT_COORDS.map(o => ({ ...o, xy: project(o.lat, o.lng) })), []);
  // Deduplicate consecutive same locations (Cwellyn nights 2 & 3)
  const routePath = useMemo(() => {
    const pts = [home, ...overnights.map(o => o.xy), home];
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  }, [home, overnights]);

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
    james: false, zipworld: false, porthclais: true, newquayboats: false, mwnt: false, pencelli: false, royaloak: false,
    cwellyn: false, erwglas: false, pengarreg: false, bennar: false, cornmill: false, conwy: false
  });

  const items = [
    { id: "james", name: "Pay James — £100 van extension", urgency: "high", date: "Before 1 Aug", note: "£50 early pickup (Sat 1 Aug) + £50 late return (Sun 9 Aug). Pay via Goboony." },
    { id: "zipworld", name: "Zip World Betws-y-Coed — Fforest Coaster", urgency: "critical", date: "Sun 2 Aug ~12:30", link: "https://www.zipworld.co.uk/adventure/fforest-coaster", note: "Whole family rides: Mason on your lap (3+ with adult), Harper & Mylo solo (9+). Book one slot for all 4 at once." },
    { id: "porthclais", name: "Porthclais Farm, St Davids", urgency: "high", date: "Fri 7 Aug", phone: "07970 439310", link: "https://porthclaiscampsite.co.uk/", note: "CONFIRMED ✓ — single Friday night booked. No electric hook-up (off-grid night). Swapped in after Caerfai's 5-night August minimum ruled it out." },
    { id: "newquayboats", name: "New Quay Boat Trips — Dolphin Spotting", urgency: "critical", date: "Thu 6 Aug ~11:30", phone: "01545 560800", link: "https://www.newquayboattrips.co.uk/", note: "1-hour Ermol VI trip, £37.50 family of 4. August + dolphins = book ahead." },
    { id: "mwnt", name: "Tŷ Gwyn, Mwnt", urgency: "high", date: "Thu 6 Aug", phone: "01239 614518", link: "https://campingatmwnt.com/", note: "Small cliff-top site" },
    { id: "pencelli", name: "Pencelli Castle, Brecon", urgency: "high", date: "Sat 8 Aug", phone: "01874 665451", link: "http://www.pencelli-castle.com/", note: "Popular Beacons site" },
    { id: "royaloak", name: "Royal Oak Inn, Pencelli — last-night dinner", urgency: "high", date: "Sat 8 Aug ~19:00", phone: "01874 665396", link: "https://www.theroyaloakpencelli.com/", note: "100m walk from the campsite. Kitchen stops at 8pm — aim for 7pm. Saturday August will be busy, book a table for 4." },
    { id: "cwellyn", name: "Snowdon Base Camp, Rhyd-Ddu (2 nights)", urgency: "high", date: "Sun 2 + Mon 3 Aug", phone: "01766 890321", link: "http://www.snowdoninn.co.uk/", note: "Phone-only via Cwellyn Arms pub (same owner). Specifically ask for one of the 3 EHU campervan bays — only 3 available." },
    { id: "erwglas", name: "Erw Glas, Maenan", urgency: "high", date: "Sat 1 Aug", phone: "01492 702486", link: "https://www.erwglasglampingandcamping.co.uk/", note: "Book a hard-standing pitch with EHU. Pre-order takeaway pizza for Sat night + breakfast hamper for Sun morning." },
    { id: "pengarreg", name: "Pengarreg, Llanrhystud", urgency: "high", date: "Wed 5 Aug", phone: "01974 202247", link: "https://pengarregcaravanpark.co.uk/", note: "Has availability — book a seafront touring pitch with EHU." },
    { id: "bennar", name: "Bennar Beach, Dyffryn Ardudwy", urgency: "high", date: "Tue 4 Aug", phone: "01341 247001", link: "https://www.bennar.co.uk/", note: "Book a grass EHU pitch — single peak-August nights are scarce here, so call to confirm. Dune boardwalk to the beach; no on-site shop." },
    { id: "cornmill", name: "The Corn Mill, Llangollen — lunch table", urgency: "low", date: "Sat 1 Aug ~13:00", link: "https://www.cornmill-llangollen.co.uk/", note: "Terrace table over the river. Book ahead — Saturday August lunch fills up." },
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

function BottomNav({ active, onChange, isDriver }) {
  const tabs = [
    { id: 'route', label: 'Route', icon: Navigation },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'todo', label: 'To do', icon: Check },
    { id: 'photos', label: isDriver ? 'Add photo' : 'Photos', icon: Camera },
  ];
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

function dayNumFromToday(now = new Date()) {
  if (now.getFullYear() !== TRIP_YEAR || now.getMonth() !== TRIP_MONTH_IDX) return null;
  const d = now.getDate();
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

function PasswordPanel({ hasPassword, setPassword }) {
  const handleSet = () => {
    const pw = window.prompt(hasPassword ? 'Enter new password (leave blank to clear)' : 'Driver password');
    if (pw === null) return;
    setPassword(pw.trim());
  };
  return (
    <div className="mb-6 p-3 rounded-lg flex items-center justify-between gap-3" style={{ background: hasPassword ? "var(--stone)" : "rgba(185, 84, 47, 0.12)", border: "1px solid var(--line)" }}>
      <div className="flex items-center gap-2 min-w-0">
        {hasPassword
          ? <Unlock size={14} style={{ color: "var(--green)" }} />
          : <Lock size={14} style={{ color: "var(--rust)" }} />}
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>
            {hasPassword ? 'Unlocked · uploads + delete enabled' : 'Set a driver password to upload or delete'}
          </p>
        </div>
      </div>
      <button
        onClick={handleSet}
        className="text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        {hasPassword ? 'Change' : 'Set'}
      </button>
    </div>
  );
}

function PhotoTab({ photos, upload, uploading, isDriver, remove, hasPassword, setPassword }) {
  const [dayNum, setDayNum] = useState(1);
  const [autoHint, setAutoHint] = useState(null);
  const [coords, setCoords] = useState(null);
  const userPicked = useRef(false);
  const inputRef = useRef(null);

  // Date-based inference on mount (no permission needed)
  useEffect(() => {
    const fromDate = dayNumFromToday();
    if (fromDate && !userPicked.current) {
      setDayNum(fromDate);
      setAutoHint(`Today is Day ${fromDate}`);
    }
  }, []);

  // Location-based inference, non-blocking
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(loc);
        const nearest = nearestOvernight(loc);
        const fromDate = dayNumFromToday();
        if (nearest && !userPicked.current) {
          if (!fromDate) {
            setDayNum(nearest.day);
            setAutoHint(`Near ${nearest.name} · Day ${nearest.day}`);
          } else if (fromDate === nearest.day) {
            setAutoHint(`Today is Day ${fromDate} · near ${nearest.name}`);
          } else {
            setAutoHint(`Today is Day ${fromDate} (you're closer to Day ${nearest.day}'s ${nearest.name})`);
          }
        }
      },
      () => { /* user denied or timed out — keep date default */ },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 8000 }
    );
  }, []);

  const handleDayChange = (e) => {
    userPicked.current = true;
    setAutoHint(null);
    setDayNum(parseInt(e.target.value, 10));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const caption = window.prompt('Caption (optional)') || '';
    try {
      await upload(file, {
        dayNum,
        stopIndex: null,
        caption,
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      });
    } catch (err) {
      alert('Upload failed: ' + err.message);
    }
  };
  return (
    <div>
      <h2 className="font-serif text-2xl md:text-3xl mb-5" style={{ color: "var(--ink)" }}>
        {isDriver ? 'Add a photo' : 'Journey log'}
      </h2>
      {isDriver && <PasswordPanel hasPassword={hasPassword} setPassword={setPassword} />}
      {isDriver && (
        <div className="mb-8 p-4 rounded-lg" style={{ background: "var(--stone)", border: "1px solid var(--line)" }}>
          <label className="block text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--slate)" }}>Assign to day</label>
          <select
            value={dayNum}
            onChange={handleDayChange}
            className="w-full p-2.5 rounded-md text-sm"
            style={{ background: "var(--cream)", border: "1px solid var(--line)", color: "var(--ink)" }}
          >
            {DAYS.map(d => <option key={d.num} value={d.num}>Day {d.num} · {d.date} · {d.title}</option>)}
          </select>
          {autoHint && (
            <p className="text-[11px] mt-1.5 mb-3 italic" style={{ color: "var(--slate)" }}>
              Auto: {autoHint}
            </p>
          )}
          {!autoHint && <div className="mb-3" />}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleUpload} />
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
      )}
      {photos.length > 0 && (
        <h3 className="font-serif text-lg mb-4 pb-1.5 border-b" style={{ color: "var(--ink)", borderColor: "var(--line)" }}>
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </h3>
      )}
      <Gallery photos={photos} isDriver={isDriver} onDelete={remove} />
    </div>
  );
}

function Gallery({ photos, isDriver, onDelete }) {
  if (!photos.length) {
    return (
      <p className="text-sm italic" style={{ color: "var(--slate)" }}>
        No photos yet — they'll appear here once the trip starts.
      </p>
    );
  }
  const byDay = photos.reduce((acc, p) => {
    (acc[p.dayNum] = acc[p.dayNum] || []).push(p);
    return acc;
  }, {});
  const dayNums = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  return (
    <>
      {dayNums.map(d => {
        const dayMeta = DAYS.find(x => x.num === d);
        return (
          <div key={d} className="mb-7">
            <h3 className="font-serif text-lg mb-3 pb-1.5 border-b" style={{ color: "var(--ink)", borderColor: "var(--line)" }}>
              Day {d}{dayMeta ? ` · ${dayMeta.title}` : ''}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {byDay[d].sort((a, b) => a.takenAt - b.takenAt).map(p => (
                <div key={p.id}>
                  <PhotoThumb photo={p} isDriver={isDriver} onDelete={onDelete} size="w-full aspect-square" />
                  {p.caption && <p className="text-[10px] mt-1 leading-tight" style={{ color: "var(--slate)" }}>{p.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function App() {
  const [openDay, setOpenDay] = useState(1);
  const [isDriver] = useState(isDriverMode);
  const { photos, upload, uploading, remove } = usePhotos();
  const { hasPassword, setPassword } = useAuth();
  const [tab, setTab] = useState('route');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab]);

  return (
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
              <RouteMap />
              <div className="mt-3 flex items-center justify-center gap-4 text-xs flex-wrap" style={{ color: "var(--slate)" }}>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "var(--ink)" }} />Overnight</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-6 h-[2px]" style={{ background: "var(--rust)", borderTop: "1px dashed" }} />Drive</span>
              </div>
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
                    isDriver={isDriver}
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

        {tab === 'photos' && <PhotoTab photos={photos} upload={upload} uploading={uploading} isDriver={isDriver} remove={remove} hasPassword={hasPassword} setPassword={setPassword} />}
      </div>

      <BottomNav active={tab} onChange={setTab} isDriver={isDriver} />
    </div>
  );
}
