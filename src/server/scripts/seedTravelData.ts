import 'dotenv/config';
import { getPool, closePool, withTransaction } from '../db/client';

/**
 * Seeds the Chennai -> Tirupati corridor.
 *
 * Provenance is applied per-row, not per-table, which is the whole point of
 * the design: train 20677 genuinely exists and genuinely serves this corridor
 * (REAL_PUBLIC, sourced), but its timings, fares and seat counts here are
 * invented (SYNTHETIC) because no lawful free source publishes them. The two
 * live side by side in the same route.
 *
 * Deterministic: the same --seed always produces the same dataset. Non-
 * reproducible demo data is a debugging nightmare.
 *
 * Usage:  npm run db:seed:travel [-- --days 90] [-- --seed 42]
 */

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32) — no dependency, reproducible across machines.
// ---------------------------------------------------------------------------
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const argOf = (name: string, fallback: number) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? Number(process.argv[i + 1]) : fallback;
};

const SEED = argOf('seed', 42);
const DAYS = argOf('days', 90);
const rng = makeRng(SEED);

const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

function dateOnly(offsetDays: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** ISO day of week: 1 = Monday .. 7 = Sunday */
function isoDow(isoDate: string): number {
  const d = new Date(isoDate + 'T00:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const DESTINATIONS = [
  {
    slug: 'chennai', name: 'Chennai', city: 'Chennai', state: 'Tamil Nadu',
    lat: 13.082680, lon: 80.270721, type: 'metro',
    description: 'Capital of Tamil Nadu and the gateway city for most South Indian travel, with major rail, air and road connections.',
    rank: 1, best: ['Nov', 'Dec', 'Jan', 'Feb'],
    tags: ['metro', 'transit-hub', 'beaches', 'heritage'],
    source: 'REAL_PUBLIC', ref: 'https://www.wikidata.org/wiki/Q1352',
  },
  {
    slug: 'tirupati', name: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh',
    lat: 13.628720, lon: 79.419380, type: 'pilgrimage',
    description: 'Temple city at the foot of the Tirumala hills, home to the Sri Venkateswara Temple — among the most visited places of worship in the world.',
    rank: 2, best: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    tags: ['pilgrimage', 'temple', 'darshan', 'family'],
    source: 'REAL_PUBLIC', ref: 'https://www.wikidata.org/wiki/Q583114',
  },
  {
    slug: 'madurai', name: 'Madurai', city: 'Madurai', state: 'Tamil Nadu',
    lat: 9.925201, lon: 78.119775, type: 'pilgrimage',
    description: 'Ancient temple city built around the Meenakshi Amman Temple, one of the oldest continuously inhabited cities in India.',
    rank: 8, best: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    tags: ['pilgrimage', 'temple', 'heritage'],
    source: 'REAL_PUBLIC', ref: 'https://www.wikidata.org/wiki/Q200878',
  },
  {
    slug: 'munnar', name: 'Munnar', city: 'Munnar', state: 'Kerala',
    lat: 10.089160, lon: 77.059769, type: 'hill_station',
    description: 'Hill station in the Western Ghats known for tea plantations, misty valleys and Eravikulam National Park.',
    rank: 5, best: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: ['hill-station', 'nature', 'honeymoon', 'family'],
    source: 'REAL_PUBLIC', ref: 'https://www.wikidata.org/wiki/Q1137583',
  },
  {
    slug: 'ooty', name: 'Ooty', city: 'Udhagamandalam', state: 'Tamil Nadu',
    lat: 11.410280, lon: 76.695000, type: 'hill_station',
    description: 'Nilgiri hill station reached by the UNESCO-listed Nilgiri Mountain Railway, known for its botanical gardens and lake.',
    rank: 6, best: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    tags: ['hill-station', 'family', 'heritage-railway'],
    source: 'REAL_PUBLIC', ref: 'https://www.wikidata.org/wiki/Q214943',
  },
];

const STATIONS = [
  { code: 'MAS', name: 'MGR Chennai Central', dest: 'chennai', lat: 13.082400, lon: 80.275200 },
  { code: 'MSB', name: 'Chennai Beach', dest: 'chennai', lat: 13.093300, lon: 80.292200 },
  { code: 'TBM', name: 'Tambaram', dest: 'chennai', lat: 12.925000, lon: 80.120000 },
  { code: 'TPTY', name: 'Tirupati Main', dest: 'tirupati', lat: 13.629000, lon: 79.419000 },
  { code: 'MDU', name: 'Madurai Junction', dest: 'madurai', lat: 9.919400, lon: 78.119400 },
];

/**
 * Routes. `verified` distinguishes what we can actually source from what we
 * are inventing — it drives data_source on the route row.
 */
const ROUTES = [
  {
    number: '20677', name: 'MGR Chennai Central - Narasapur Vande Bharat Express',
    family: 'vande_bharat', mode: 'train', from: 'MAS', to: 'TPTY', km: 133,
    // The service is real and does serve this corridor; its Tirupati-leg
    // timings and fares below are NOT sourced and are marked SYNTHETIC.
    verified: true,
    ref: 'https://en.wikipedia.org/wiki/MGR_Chennai_Central%E2%80%93Narasapur_Vande_Bharat_Express',
    dep: '05:30', arr: '08:25', days: [1, 2, 3, 4, 5, 6],
    classes: [
      { code: 'CC', name: 'AC Chair Car', fare: 690 },
      { code: 'EC', name: 'Executive Chair Car', fare: 1355 },
    ],
  },
  {
    number: '16057', name: 'Sapthagiri Express',
    family: 'express', mode: 'train', from: 'MAS', to: 'TPTY', km: 133,
    verified: true,
    ref: 'https://en.wikipedia.org/wiki/Sapthagiri_Express',
    dep: '06:25', arr: '09:40', days: [1, 2, 3, 4, 5, 6, 7],
    classes: [
      { code: '2S', name: 'Second Sitting', fare: 105 },
      { code: 'CC', name: 'AC Chair Car', fare: 415 },
    ],
  },
  {
    number: 'APSRTC-TPT', name: 'APSRTC Super Luxury Coach',
    family: 'bus_luxury', mode: 'bus', from: 'MAS', to: 'TPTY', km: 150,
    verified: false,
    ref: null,
    dep: '22:30', arr: '03:15', days: [1, 2, 3, 4, 5, 6, 7],
    classes: [{ code: 'SL', name: 'Super Luxury Seater', fare: 480 }],
  },
];

const TIRUPATI_HOTELS = [
  { name: 'Sri Balaji Residency', type: 'lodge', cat: 2, star: 3.6, km: 1.2, rooms: [['Standard Double', 2, 950], ['Deluxe Double', 2, 1400]] },
  { name: 'Tirumala Pilgrim Lodge', type: 'dharamshala', cat: 1, star: 3.1, km: 0.8, rooms: [['Non-AC Twin', 2, 600], ['AC Twin', 2, 900]] },
  { name: 'Hotel Annapurna Grand', type: 'hotel', cat: 3, star: 4.0, km: 2.4, rooms: [['Superior Room', 2, 2200], ['Family Room', 4, 3400]] },
  { name: 'Sapthagiri Comforts', type: 'hotel', cat: 3, star: 3.9, km: 1.9, rooms: [['Standard AC', 2, 1800], ['Suite', 3, 3100]] },
  { name: 'Marasa Sarovar Premiere', type: 'resort', cat: 5, star: 4.5, km: 3.5, rooms: [['Premier Room', 2, 6800], ['Executive Suite', 3, 11500]] },
  { name: 'Govindarajaswamy Guest House', type: 'guesthouse', cat: 1, star: 3.3, km: 0.5, rooms: [['Basic Twin', 2, 550]] },
];

const TIRUPATI_FOOD = [
  { provider: 'Hotel Woodlands Tirupati', ptype: 'restaurant', meal: 'lunch', diet: 'veg', cuisine: 'South Indian', price: 180, desc: 'Unlimited South Indian vegetarian meals near the railway station.' },
  { provider: 'Hotel Woodlands Tirupati', ptype: 'restaurant', meal: 'breakfast', diet: 'veg', cuisine: 'South Indian', price: 110, desc: 'Idli, dosa, pongal and filter coffee.' },
  { provider: 'Sri Krishna Bhavan', ptype: 'restaurant', meal: 'dinner', diet: 'veg', cuisine: 'South Indian', price: 160, desc: 'Traditional vegetarian dinner thali.' },
  { provider: 'Tirumala Satvik Kitchen', ptype: 'restaurant', meal: 'lunch', diet: 'satvik', cuisine: 'Satvik', price: 140, desc: 'Onion-free and garlic-free satvik meals suited to pilgrims.' },
  { provider: 'Jain Bhojanalay Tirupati', ptype: 'restaurant', meal: 'lunch', diet: 'jain', cuisine: 'North Indian', price: 220, desc: 'Jain thali prepared without root vegetables.' },
  { provider: 'Annapurna Snacks Corner', ptype: 'restaurant', meal: 'snack', diet: 'veg', cuisine: 'South Indian', price: 70, desc: 'Vada, bonda and tea near the bus stand.' },
];

const ONBOARD_FOOD = [
  { provider: 'IRCTC Onboard Catering', meal: 'breakfast', diet: 'veg', price: 150, desc: 'Vegetarian breakfast served at your seat.' },
  { provider: 'IRCTC Onboard Catering', meal: 'breakfast', diet: 'non_veg', price: 180, desc: 'Non-vegetarian breakfast served at your seat.' },
  { provider: 'IRCTC Onboard Catering', meal: 'combo', diet: 'veg', price: 260, desc: 'Breakfast plus tea and evening snack combo.' },
];

// Fee schedule and darshan facts, kept as data rather than magic numbers.
const DARSHAN_TYPES = [
  {
    name: 'Sarva Darshan (Free)', code: 'SARVA', price: 0, duration: 240,
    booking: 'walk_in', advance: 0,
    eligibility: 'Open to all pilgrims. No booking required.',
    restrictions: ['Waiting time varies widely with crowd levels', 'Compartment queue entry'],
    notes: 'Free general darshan. Waiting can extend to several hours on weekends and festival days.',
  },
  {
    name: 'Special Entry Darshan (Rs.300)', code: 'SED300', price: 300, duration: 120,
    booking: 'online_quota', advance: 60,
    eligibility: 'Requires online booking with valid photo ID for each pilgrim.',
    restrictions: ['Photo ID mandatory', 'Slot timing must be observed'],
    notes: 'Time-slotted paid darshan with a shorter queue than Sarva Darshan.',
  },
  {
    name: 'Divya Darshan (Footpath Pilgrims)', code: 'DIVYA', price: 0, duration: 180,
    booking: 'offline_only', advance: 0,
    eligibility: 'For pilgrims ascending Tirumala on foot via the Alipiri or Srivari Mettu routes.',
    restrictions: ['Requires Divya Darshan token issued on the footpath'],
    notes: 'Free darshan for pilgrims who walk up the hill.',
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  const pool = getPool();
  console.log(`Seeding travel data  (seed=${SEED}, ${DAYS} days of availability)\n`);

  await withTransaction(async (c) => {
    // ---- Destinations -----------------------------------------------------
    const destId: Record<string, number> = {};
    for (const d of DESTINATIONS) {
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO destinations
           (slug,name,city,state,country,latitude,longitude,destination_type,
            description,popularity_rank,best_months,tags,data_source,source_reference)
         VALUES ($1,$2,$3,$4,'India',$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (slug) DO UPDATE SET
           name=EXCLUDED.name, description=EXCLUDED.description, updated_at=now()
         RETURNING id`,
        [d.slug, d.name, d.city, d.state, d.lat, d.lon, d.type, d.description,
         d.rank, d.best, JSON.stringify(d.tags), d.source, d.ref]
      );
      destId[d.slug] = Number(rows[0].id);
    }
    console.log(`  destinations         ${Object.keys(destId).length}`);

    // ---- Operators & stations --------------------------------------------
    const { rows: opRows } = await c.query<{ id: string }>(
      `INSERT INTO transport_operators (name,code,mode,data_source)
       VALUES ('Indian Railways','IR','train','REAL_PUBLIC')
       ON CONFLICT (name,mode) DO UPDATE SET code=EXCLUDED.code
       RETURNING id`
    );
    const railOpId = Number(opRows[0].id);

    const { rows: busOpRows } = await c.query<{ id: string }>(
      `INSERT INTO transport_operators (name,code,mode,data_source)
       VALUES ('APSRTC','APSRTC','bus','SYNTHETIC')
       ON CONFLICT (name,mode) DO UPDATE SET code=EXCLUDED.code
       RETURNING id`
    );
    const busOpId = Number(busOpRows[0].id);

    const stationId: Record<string, number> = {};
    for (const s of STATIONS) {
      const mode = s.code === 'MAA' ? 'flight' : 'train';
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO transport_stations
           (destination_id,code,name,mode,latitude,longitude,data_source)
         VALUES ($1,$2,$3,$4,$5,$6,'REAL_PUBLIC')
         ON CONFLICT (code,mode) DO UPDATE SET name=EXCLUDED.name
         RETURNING id`,
        [destId[s.dest], s.code, s.name, mode, s.lat, s.lon]
      );
      stationId[s.code] = Number(rows[0].id);
    }
    console.log(`  stations             ${Object.keys(stationId).length}`);

    // ---- Routes, schedules, classes, availability -------------------------
    let schedCount = 0;
    let availCount = 0;
    const routeIdByNumber: Record<string, number> = {};

    for (const r of ROUTES) {
      // Bus routes reuse the rail station rows as stops for MVP simplicity.
      const { rows: rr } = await c.query<{ id: string }>(
        `INSERT INTO transport_routes
           (operator_id,mode,service_number,service_name,service_class_family,
            origin_station_id,dest_station_id,distance_km,data_source,source_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (service_number,origin_station_id,dest_station_id)
           DO UPDATE SET service_name=EXCLUDED.service_name
         RETURNING id`,
        [
          r.mode === 'bus' ? busOpId : railOpId,
          r.mode, r.number, r.name, r.family,
          stationId[r.from], stationId[r.to], r.km,
          // The service existing is sourced; everything below it is not.
          r.verified ? 'REAL_PUBLIC' : 'SYNTHETIC',
          r.ref,
        ]
      );
      const routeId = Number(rr[0].id);
      routeIdByNumber[r.number] = routeId;

      for (const cls of r.classes) {
        await c.query(
          `INSERT INTO transport_classes (route_id,class_code,class_name,base_fare_inr,data_source)
           VALUES ($1,$2,$3,$4,'SYNTHETIC')
           ON CONFLICT (route_id,class_code) DO UPDATE SET base_fare_inr=EXCLUDED.base_fare_inr`,
          [routeId, cls.code, cls.name, cls.fare]
        );
      }

      const depH = Number(r.dep.slice(0, 2)), depM = Number(r.dep.slice(3));
      const arrH = Number(r.arr.slice(0, 2)), arrM = Number(r.arr.slice(3));
      let mins = arrH * 60 + arrM - (depH * 60 + depM);
      if (mins < 0) mins += 24 * 60;

      const { rows: sr } = await c.query<{ id: string }>(
        `INSERT INTO transport_schedules
           (route_id,departure_time,arrival_time,duration_minutes,operating_days,
            valid_from,valid_to,data_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'SYNTHETIC')
         RETURNING id`,
        [routeId, r.dep, r.arr, mins, r.days, dateOnly(0), dateOnly(DAYS + 30)]
      );
      const scheduleId = Number(sr[0].id);
      schedCount++;

      // Date-specific inventory. Deliberately includes sold-out and waitlist
      // days: a dataset where everything is always available hides exactly the
      // failure paths the assistant has to handle well.
      for (let day = 0; day <= DAYS; day++) {
        const date = dateOnly(day);
        if (!r.days.includes(isoDow(date))) continue;

        const dow = isoDow(date);
        const isWeekend = dow >= 6;

        for (const cls of r.classes) {
          const total = cls.code === 'EC' ? 52 : cls.code === '2S' ? 300 : 180;
          // Weekend and near-term dates are tighter.
          const pressure = (isWeekend ? 0.45 : 0.15) + Math.max(0, (30 - day) / 120);
          const soldFraction = Math.min(1.05, pressure + rng() * 0.55);
          const available = Math.max(0, Math.round(total * (1 - soldFraction)));

          let status: string;
          if (available === 0) status = rng() < 0.5 ? 'SOLD_OUT' : 'WAITLIST';
          else if (available < total * 0.05) status = 'RAC';
          else status = 'AVAILABLE';

          // Mild dynamic pricing on the premium classes.
          const surge = cls.code === 'EC' || cls.code === 'CC' ? 1 + (isWeekend ? 0.08 : 0) : 1;
          const fare = Math.round(cls.fare * surge);

          await c.query(
            `INSERT INTO transport_availability
               (schedule_id,class_code,travel_date,total_seats,available_seats,
                fare_inr,status,data_source,confidence)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'SYNTHETIC','ILLUSTRATIVE')
             ON CONFLICT (schedule_id,class_code,travel_date) DO NOTHING`,
            [scheduleId, cls.code, date, total, available, fare, status]
          );
          availCount++;
        }
      }
    }
    console.log(`  routes               ${ROUTES.length}`);
    console.log(`  schedules            ${schedCount}`);
    console.log(`  transport availability ${availCount}`);

    // ---- Hotels -----------------------------------------------------------
    let roomTypeCount = 0;
    let hotelAvailCount = 0;
    for (const h of TIRUPATI_HOTELS) {
      const { rows: hr } = await c.query<{ id: string }>(
        `INSERT INTO hotels
           (destination_id,name,address,latitude,longitude,category,hotel_type,
            star_rating,review_count,amenities,check_in_time,check_out_time,
            distance_to_landmark_km,landmark_name,cancellation_policy,data_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'12:00','10:00',$11,
                 'Tirupati Railway Station',
                 'Free cancellation up to 24 hours before check-in.','SYNTHETIC')
         RETURNING id`,
        [
          destId['tirupati'], h.name, `${h.name}, Tirupati, Andhra Pradesh`,
          13.62 + (rng() - 0.5) * 0.04, 79.41 + (rng() - 0.5) * 0.04,
          h.cat, h.type, h.star, randInt(40, 900),
          JSON.stringify(
            h.cat >= 4
              ? ['wifi', 'ac', 'restaurant', 'parking', 'room_service', 'laundry']
              : h.cat >= 3
                ? ['wifi', 'ac', 'restaurant', 'parking']
                : ['fan', 'parking']
          ),
          h.km,
        ]
      );
      const hotelId = Number(hr[0].id);

      for (const [rname, occ, price] of h.rooms as [string, number, number][]) {
        const { rows: rt } = await c.query<{ id: string }>(
          `INSERT INTO hotel_room_types
             (hotel_id,name,max_occupancy,bed_config,base_price_per_night_inr,data_source)
           VALUES ($1,$2,$3,$4,$5,'SYNTHETIC') RETURNING id`,
          [hotelId, rname, occ, occ > 2 ? 'Multiple beds' : 'Twin or double', price]
        );
        const roomTypeId = Number(rt[0].id);
        roomTypeCount++;

        for (let day = 0; day <= DAYS; day++) {
          const date = dateOnly(day);
          const isWeekend = isoDow(date) >= 6;
          const total = randInt(4, 20);
          const available = Math.max(0, total - randInt(0, isWeekend ? total : Math.floor(total * 0.6)));
          const nightly = Math.round(price * (isWeekend ? 1.25 : 1) * (0.95 + rng() * 0.15));

          await c.query(
            `INSERT INTO hotel_availability
               (room_type_id,stay_date,rooms_total,rooms_available,
                price_per_night_inr,data_source,confidence)
             VALUES ($1,$2,$3,$4,$5,'SYNTHETIC','ILLUSTRATIVE')
             ON CONFLICT (room_type_id,stay_date) DO NOTHING`,
            [roomTypeId, date, total, available, nightly]
          );
          hotelAvailCount++;
        }
      }
    }
    console.log(`  hotels               ${TIRUPATI_HOTELS.length}`);
    console.log(`  room types           ${roomTypeCount}`);
    console.log(`  hotel availability   ${hotelAvailCount}`);

    // ---- Food -------------------------------------------------------------
    for (const f of TIRUPATI_FOOD) {
      await c.query(
        `INSERT INTO food_options
           (destination_id,provider_name,provider_type,meal_type,cuisine,diet_type,
            price_inr,serves_count,description,data_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,1,$8,'SYNTHETIC')`,
        [destId['tirupati'], f.provider, f.ptype, f.meal, f.cuisine, f.diet, f.price, f.desc]
      );
    }
    // Onboard catering attaches to the train, so "food for the journey"
    // resolves to the service the traveller is actually on.
    for (const routeNumber of ['20677', '16057']) {
      for (const f of ONBOARD_FOOD) {
        await c.query(
          `INSERT INTO food_options
             (available_on_route_id,provider_name,provider_type,meal_type,cuisine,
              diet_type,price_inr,serves_count,description,data_source)
           VALUES ($1,$2,'onboard_catering',$3,'Indian',$4,$5,1,$6,'SYNTHETIC')`,
          [routeIdByNumber[routeNumber], f.provider, f.meal, f.diet, f.price, f.desc]
        );
      }
    }
    console.log(`  food options         ${TIRUPATI_FOOD.length + ONBOARD_FOOD.length * 2}`);

    // ---- Temple & darshan -------------------------------------------------
    const { rows: tr } = await c.query<{ id: string }>(
      `INSERT INTO temples
         (destination_id,name,deity,managing_body,latitude,longitude,dress_code,
          general_guidelines,official_url,data_source,source_reference)
       VALUES ($1,'Sri Venkateswara Swamy Temple, Tirumala','Lord Venkateswara',
               'Tirumala Tirupati Devasthanams (TTD)',13.683400,79.347200,
               'Traditional Indian attire is required. Men: dhoti or pyjama with upper cloth. Women: saree, half-saree or chudidhar with dupatta.',
               'The temple is on the Tirumala hills, about 22 km uphill from Tirupati town. Mobile phones and cameras are not permitted inside. Free Anna Prasadam is served to all pilgrims.',
               'https://www.tirumala.org','REAL_PUBLIC','https://www.tirumala.org')
       RETURNING id`,
      [destId['tirupati']]
    );
    const templeId = Number(tr[0].id);

    let darshanAvailCount = 0;
    for (const d of DARSHAN_TYPES) {
      const { rows: dr } = await c.query<{ id: string }>(
        `INSERT INTO darshan_types
           (temple_id,name,code,price_inr,typical_duration_minutes,booking_mode,
            eligibility,restrictions,advance_booking_days,notes,data_source,source_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'REAL_PUBLIC','https://www.tirumala.org')
         ON CONFLICT (temple_id,name) DO UPDATE SET price_inr=EXCLUDED.price_inr
         RETURNING id`,
        [templeId, d.name, d.code, d.price, d.duration, d.booking,
         d.eligibility, JSON.stringify(d.restrictions), d.advance, d.notes]
      );
      const darshanTypeId = Number(dr[0].id);

      // Quotas are invented. TTD publishes no third-party availability API, so
      // these rows are SYNTHETIC/ILLUSTRATIVE and must never render as booked.
      const slots = d.code === 'SED300'
        ? ['06:00', '09:00', '12:00', '15:00', '18:00']
        : ['06:00'];

      for (let day = 0; day <= DAYS; day++) {
        const date = dateOnly(day);
        const isWeekend = isoDow(date) >= 6;
        for (const slot of slots) {
          const total = d.code === 'SED300' ? 3000 : 20000;
          const taken = Math.round(total * ((isWeekend ? 0.75 : 0.45) + rng() * 0.3));
          await c.query(
            `INSERT INTO darshan_availability
               (darshan_type_id,slot_date,slot_start,quota_total,quota_available,
                data_source,confidence)
             VALUES ($1,$2,$3,$4,$5,'SYNTHETIC','ILLUSTRATIVE')
             ON CONFLICT (darshan_type_id,slot_date,slot_start) DO NOTHING`,
            [darshanTypeId, date, slot, total, Math.max(0, total - taken)]
          );
          darshanAvailCount++;
        }
      }
    }
    console.log(`  darshan types        ${DARSHAN_TYPES.length}`);
    console.log(`  darshan availability ${darshanAvailCount}`);

    // ---- Link existing packages to destinations ---------------------------
    await c.query(
      `UPDATE packages SET destination_id=$1, duration_days=2, duration_nights=1,
                           traveller_type=ARRAY['pilgrim','family','senior'],
                           status='active'
       WHERE id='ind-6'`,
      [destId['tirupati']]
    );
    await c.query(
      `UPDATE packages SET destination_id=$1, status='active' WHERE id='ind-1'`,
      [destId['munnar']]
    );
    console.log(`  packages linked      2`);

    // ---- Fee schedule -----------------------------------------------------
    await c.query(`DELETE FROM price_components WHERE owner_type='global'`);
    await c.query(
      `INSERT INTO price_components (owner_type,owner_id,kind,label,amount_inr,percent,unit,sort_order)
       VALUES ('global','default','service_fee','Agriya service fee',100,NULL,'per_trip',1),
              ('global','default','tax','GST (5%)',NULL,5.00,'per_trip',2)`
    );
    console.log(`  price components     2`);
  });

  await pool.query('ANALYZE');
  console.log('\nDone.');
}

main()
  .catch((err) => {
    console.error('\nTravel data seed failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
