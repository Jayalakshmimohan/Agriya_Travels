import 'dotenv/config';
import { getPool, closePool, withTransaction } from '../db/client';

/**
 * Generates a broad DEMO catalogue so the assistant has something to answer
 * with across the whole range of things people ask for.
 *
 * Everything here is marked DEMO. These are real places with honest
 * descriptions, but the packages, prices and durations are composed by this
 * script — they are not Agriya's rate card. The provenance column is what
 * keeps the assistant's disclosure truthful, so it must not be overstated.
 *
 * Composed rather than hand-written: destination x theme, priced from a tier
 * rate. That gives breadth without 250 hand-typed rows, and keeps prices
 * internally consistent — a 7-day luxury trip always costs more than a 3-day
 * budget one at the same destination.
 *
 * Deterministic: the same --seed reproduces the catalogue exactly.
 *
 *   npm run db:seed:catalogue
 */

// ---------------------------------------------------------------------------
// Deterministic RNG
// ---------------------------------------------------------------------------
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
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
const rng = makeRng(argOf('seed', 1337));
const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
const randInt = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));

// ---------------------------------------------------------------------------
// Destinations
//
// `tier` sets the price band, `tags` are the vocabulary discovery matches
// against. Tags are generous on purpose: they are how "somewhere calm with
// snow where I can drink tea with locals" reaches a row.
// ---------------------------------------------------------------------------

type Tier = 'budget' | 'mid' | 'premium' | 'luxury';

interface Dest {
  slug: string;
  name: string;
  state?: string;
  country?: string;
  type: string;
  tier: Tier;
  rank: number;
  months: string[];
  tags: string[];
  desc: string;
}

const M = {
  winter: ['Nov', 'Dec', 'Jan', 'Feb'],
  winterLong: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
  summer: ['Mar', 'Apr', 'May', 'Jun'],
  monsoon: ['Jun', 'Jul', 'Aug', 'Sep'],
  postMonsoon: ['Sep', 'Oct', 'Nov'],
  allYear: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  himalSummer: ['May', 'Jun', 'Jul', 'Aug', 'Sep'],
};

const T = {
  snow: ['snow', 'cold', 'mountains', 'himalayas'],
  calm: ['calm', 'peaceful', 'slow', 'quiet'],
  village: ['village', 'homestay', 'remote'],
  tea: ['tea', 'tea-plantation'],
  beach: ['beach', 'warm', 'island'],
  heritage: ['heritage', 'history', 'monuments', 'culture'],
  pilgrim: ['pilgrimage', 'temples', 'spiritual'],
  wild: ['wildlife', 'safari', 'nature', 'forest'],
  city: ['city', 'metro', 'modern', 'street-food'],
  adventure: ['adventure', 'trekking'],
  honeymoon: ['honeymoon', 'couples'],
  family: ['family'],
  luxury: ['luxury'],
  budget: ['budget'],
};
const t = (...groups: string[][]) => Array.from(new Set(groups.flat()));

const DESTINATIONS: Dest[] = [
  // ---------- Himalaya / snow / mountain ----------
  { slug: 'darjeeling', name: 'Darjeeling', state: 'West Bengal', type: 'hill_station', tier: 'mid', rank: 18, months: M.winterLong,
    tags: t(T.snow, T.calm, T.tea, T.village, ['toy-train', 'sunrise', 'monastery', 'cool']),
    desc: 'Himalayan tea town looking out at Kangchenjunga, reached by the narrow-gauge toy train. Steep lanes, tea gardens and quiet monasteries.' },
  { slug: 'gangtok', name: 'Gangtok & East Sikkim', state: 'Sikkim', type: 'hill_station', tier: 'mid', rank: 21, months: M.winterLong,
    tags: t(T.snow, T.calm, T.village, ['monastery', 'lake', 'cool', 'nature', 'momos']),
    desc: 'Sikkimese hill capital of prayer flags and monasteries, with day trips to the high-altitude Tsomgo Lake and old trade routes.' },
  { slug: 'spiti-valley', name: 'Spiti Valley', state: 'Himachal Pradesh', type: 'adventure', tier: 'mid', rank: 26, months: M.himalSummer,
    tags: t(T.snow, T.calm, T.village, T.adventure, ['cold-desert', 'monastery', 'remote', 'landscapes', 'photography', 'butter-tea']),
    desc: 'A cold desert of ochre cliffs and whitewashed monasteries. Tiny villages like Kibber and Langza sit above 4,000 m, and homestay tea is the social currency.' },
  { slug: 'auli', name: 'Auli', state: 'Uttarakhand', type: 'hill_station', tier: 'mid', rank: 30, months: M.winter,
    tags: t(T.snow, T.calm, ['skiing', 'cable-car', 'cold', 'mountains', 'landscapes']),
    desc: 'Meadow slopes above Joshimath with skiing in winter and long views to Nanda Devi. One of the few places in India with reliable snow.' },
  { slug: 'nainital', name: 'Nainital', state: 'Uttarakhand', type: 'hill_station', tier: 'budget', rank: 24, months: M.summer,
    tags: t(T.calm, T.family, ['lake', 'boating', 'cool', 'mountains', 'weekend']),
    desc: 'Colonial lake town in the Kumaon hills, built around boating on the Naini lake with viewpoints on the ridge above.' },
  { slug: 'mussoorie', name: 'Mussoorie', state: 'Uttarakhand', type: 'hill_station', tier: 'budget', rank: 27, months: M.summer,
    tags: t(T.calm, T.family, ['cool', 'mountains', 'weekend', 'waterfall', 'mall-road']),
    desc: 'The Queen of the Hills — a ridge-top promenade, waterfalls in the folds below, and Doon valley laid out beneath.' },
  { slug: 'kodaikanal', name: 'Kodaikanal', state: 'Tamil Nadu', type: 'hill_station', tier: 'budget', rank: 22, months: M.winterLong,
    tags: t(T.calm, T.family, T.honeymoon, ['lake', 'cool', 'mountains', 'shola-forest', 'weekend']),
    desc: 'Palani hills station of shola forest and a star-shaped lake, misty for most of the year and easy to reach from Chennai.' },
  { slug: 'coorg', name: 'Coorg (Madikeri)', state: 'Karnataka', type: 'hill_station', tier: 'mid', rank: 19, months: M.postMonsoon,
    tags: t(T.calm, T.village, T.honeymoon, ['coffee', 'coffee-plantation', 'misty', 'waterfall', 'homestay', 'cool', 'nature']),
    desc: 'Coffee country in the Western Ghats — plantation homestays, misty mornings, and Kodava food you will not find elsewhere.' },
  { slug: 'wayanad', name: 'Wayanad', state: 'Kerala', type: 'nature', tier: 'mid', rank: 23, months: M.postMonsoon,
    tags: t(T.calm, T.village, T.wild, ['forest', 'waterfall', 'caves', 'homestay', 'spice', 'cool', 'trekking']),
    desc: 'Forested plateau of spice gardens, Edakkal caves and tea slopes, with elephants in the neighbouring reserves.' },
  { slug: 'dharamshala', name: 'Dharamshala & McLeod Ganj', state: 'Himachal Pradesh', type: 'hill_station', tier: 'budget', rank: 25, months: M.winterLong,
    tags: t(T.snow, T.calm, T.village, ['tibetan', 'monastery', 'meditation', 'yoga', 'trekking', 'cafe', 'cool']),
    desc: 'Tibetan hill town below the Dhauladhar wall — monasteries, meditation courses, and cafes full of trekkers heading to Triund.' },
  { slug: 'tawang', name: 'Tawang', state: 'Arunachal Pradesh', type: 'hill_station', tier: 'mid', rank: 40, months: M.himalSummer,
    tags: t(T.snow, T.calm, T.village, ['monastery', 'remote', 'landscapes', 'high-altitude', 'butter-tea']),
    desc: 'Remote Monpa country at 3,000 m, home to one of the largest monasteries in India and passes that hold snow most of the year.' },
  { slug: 'valparai', name: 'Valparai', state: 'Tamil Nadu', type: 'hill_station', tier: 'budget', rank: 44, months: M.postMonsoon,
    tags: t(T.calm, T.tea, T.village, T.wild, ['misty', 'elephants', 'cool', 'slow', 'hairpin-bends']),
    desc: 'Forty hairpin bends up into tea estates where elephants and lion-tailed macaques still cross the road. Almost no tourists.' },
  { slug: 'chopta', name: 'Chopta & Tungnath', state: 'Uttarakhand', type: 'adventure', tier: 'budget', rank: 42, months: M.himalSummer,
    tags: t(T.snow, T.calm, T.adventure, T.village, ['trekking', 'meadows', 'camping', 'temple', 'cold']),
    desc: 'Alpine meadow base for the short climb to Tungnath, the highest Shiva temple, with Chandrashila summit above it.' },

  // ---------- Beach / island ----------
  { slug: 'andaman', name: 'Andaman Islands', state: 'Andaman & Nicobar', type: 'island', tier: 'premium', rank: 11, months: M.winterLong,
    tags: t(T.beach, T.honeymoon, T.family, ['scuba', 'snorkelling', 'island', 'coral', 'clear-water', 'ferry']),
    desc: 'Radhanagar and Elephant beaches on Havelock, live coral off Neil Island, and some of the clearest diving water in the country.' },
  { slug: 'lakshadweep', name: 'Lakshadweep', state: 'Lakshadweep', type: 'island', tier: 'luxury', rank: 34, months: M.winterLong,
    tags: t(T.beach, T.honeymoon, T.calm, T.luxury, ['atoll', 'lagoon', 'snorkelling', 'private', 'island', 'permit']),
    desc: 'Coral atolls with lagoons the colour of glass. Permits are limited, which is exactly why it stays quiet.' },
  { slug: 'gokarna', name: 'Gokarna', state: 'Karnataka', type: 'beach', tier: 'budget', rank: 28, months: M.winterLong,
    tags: t(T.beach, T.calm, T.budget, T.village, ['temple', 'cliff', 'backpacking', 'sunset', 'slow']),
    desc: 'Temple town with a string of cliff-backed beaches — Om, Kudle, Half Moon — reached on foot and still unhurried.' },
  { slug: 'varkala', name: 'Varkala', state: 'Kerala', type: 'beach', tier: 'mid', rank: 29, months: M.winterLong,
    tags: t(T.beach, T.calm, ['cliff', 'ayurveda', 'yoga', 'sunset', 'cafe', 'slow']),
    desc: 'Red laterite cliff with a beach path of cafes and Ayurveda clinics, and a natural spring at the north end.' },
  { slug: 'pondicherry', name: 'Pondicherry', state: 'Puducherry', type: 'beach', tier: 'mid', rank: 16, months: M.winterLong,
    tags: t(T.beach, T.calm, T.heritage, ['french-quarter', 'cafe', 'cycling', 'auroville', 'weekend', 'slow']),
    desc: 'Mustard-walled French quarter, a seafront promenade closed to cars in the evening, and Auroville just up the coast.' },
  { slug: 'mahabalipuram', name: 'Mahabalipuram', state: 'Tamil Nadu', type: 'heritage', tier: 'budget', rank: 32, months: M.winterLong,
    tags: t(T.heritage, T.beach, T.family, ['shore-temple', 'rock-cut', 'unesco', 'weekend', 'stone-carving']),
    desc: 'Pallava shore temples and rock-cut rathas on the beach an hour south of Chennai, still worked by stone carvers today.' },
  { slug: 'tarkarli', name: 'Tarkarli', state: 'Maharashtra', type: 'beach', tier: 'budget', rank: 46, months: M.winterLong,
    tags: t(T.beach, T.calm, T.budget, T.village, ['scuba', 'backwater', 'seafood', 'homestay', 'slow']),
    desc: 'Konkan fishing village with white sand, clear water for scuba, and Malvani seafood cooked in family homestays.' },
  { slug: 'diu', name: 'Diu', state: 'Diu', type: 'beach', tier: 'budget', rank: 45, months: M.winterLong,
    tags: t(T.beach, T.calm, T.heritage, T.budget, ['portuguese', 'fort', 'quiet', 'slow', 'cycling']),
    desc: 'A former Portuguese island of whitewashed churches, a sea fort and beaches that stay empty on weekdays.' },

  // ---------- Backwaters ----------
  { slug: 'alleppey', name: 'Alleppey (Alappuzha)', state: 'Kerala', type: 'backwaters', tier: 'mid', rank: 13, months: M.winterLong,
    tags: t(T.calm, T.honeymoon, T.family, T.village, ['houseboat', 'backwaters', 'canals', 'coconut', 'slow', 'kettuvallam']),
    desc: 'Overnight houseboats through the Vembanad canals, past paddy below sea level and villages that live on the water.' },
  { slug: 'kumarakom', name: 'Kumarakom', state: 'Kerala', type: 'backwaters', tier: 'premium', rank: 20, months: M.winterLong,
    tags: t(T.calm, T.honeymoon, T.luxury, ['backwaters', 'bird-sanctuary', 'ayurveda', 'resort', 'slow', 'lake']),
    desc: 'Lakeside resorts and a bird sanctuary on the Vembanad shore — the quieter, more polished side of the backwaters.' },

  // ---------- Desert ----------
  { slug: 'jaisalmer', name: 'Jaisalmer', state: 'Rajasthan', type: 'desert', tier: 'mid', rank: 17, months: M.winter,
    tags: t(T.heritage, T.honeymoon, ['desert', 'fort', 'camel', 'dunes', 'camping', 'folk-music', 'warm']),
    desc: 'A living sandstone fort above the Thar, with camel and jeep camps out on the Sam dunes for the night.' },
  { slug: 'rann-of-kutch', name: 'Rann of Kutch', state: 'Gujarat', type: 'desert', tier: 'mid', rank: 33, months: M.winter,
    tags: t(T.heritage, T.village, ['salt-desert', 'white-desert', 'handicraft', 'full-moon', 'festival', 'photography']),
    desc: 'A white salt flat to the horizon, best on a full-moon night during Rann Utsav, with embroidery villages on the edge.' },
  { slug: 'bikaner', name: 'Bikaner', state: 'Rajasthan', type: 'desert', tier: 'budget', rank: 47, months: M.winter,
    tags: t(T.heritage, T.budget, ['desert', 'fort', 'camel', 'temple', 'sweets', 'warm']),
    desc: 'Junagarh Fort, the national camel research centre, and Bikaneri food that deserves the trip on its own.' },

  // ---------- Heritage ----------
  { slug: 'khajuraho', name: 'Khajuraho', state: 'Madhya Pradesh', type: 'heritage', tier: 'budget', rank: 35, months: M.winterLong,
    tags: t(T.heritage, ['unesco', 'temples', 'sculpture', 'sound-and-light', 'photography']),
    desc: 'Chandela temples covered in some of the finest stone sculpture in India, set in quiet gardens.' },
  { slug: 'ajanta-ellora', name: 'Ajanta & Ellora', state: 'Maharashtra', type: 'heritage', tier: 'mid', rank: 31, months: M.winterLong,
    tags: t(T.heritage, ['unesco', 'caves', 'rock-cut', 'buddhist', 'jain', 'painting', 'kailasa']),
    desc: 'Buddhist painted caves at Ajanta and the monolithic Kailasa temple at Ellora, both cut from solid rock.' },
  { slug: 'mysore', name: 'Mysore', state: 'Karnataka', type: 'heritage', tier: 'budget', rank: 15, months: M.winterLong,
    tags: t(T.heritage, T.family, ['palace', 'dussehra', 'market', 'silk', 'sandalwood', 'weekend', 'yoga']),
    desc: 'Wodeyar palace city of the Devaraja market, Chamundi Hill and a Dussehra procession worth planning around.' },
  { slug: 'badami', name: 'Badami & Pattadakal', state: 'Karnataka', type: 'heritage', tier: 'budget', rank: 48, months: M.winterLong,
    tags: t(T.heritage, T.budget, ['unesco', 'cave-temples', 'chalukya', 'sandstone', 'quiet']),
    desc: 'Chalukyan cave temples cut into red sandstone above a tank, with the Pattadakal temple group nearby.' },
  { slug: 'orchha', name: 'Orchha', state: 'Madhya Pradesh', type: 'heritage', tier: 'budget', rank: 49, months: M.winterLong,
    tags: t(T.heritage, T.calm, T.budget, T.village, ['cenotaphs', 'river', 'palace', 'quiet', 'slow', 'sunset']),
    desc: 'Bundela palaces and riverside cenotaphs in a village that has stayed small. Almost nobody is there at sunset.' },
  { slug: 'konark-puri', name: 'Konark & Puri', state: 'Odisha', type: 'heritage', tier: 'budget', rank: 36, months: M.winterLong,
    tags: t(T.heritage, T.pilgrim, T.beach, ['sun-temple', 'unesco', 'jagannath', 'beach', 'chariot-festival']),
    desc: 'The Sun Temple chariot at Konark and the Jagannath temple at Puri, with a long beach between them.' },
  { slug: 'bishnupur', name: 'Bishnupur', state: 'West Bengal', type: 'heritage', tier: 'budget', rank: 52, months: M.winterLong,
    tags: t(T.heritage, T.budget, T.village, ['terracotta', 'temples', 'baluchari-saree', 'quiet', 'craft']),
    desc: 'Malla-era terracotta temples and Baluchari weaving in a Bengal town most itineraries skip.' },

  // ---------- Pilgrimage ----------
  { slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', type: 'pilgrimage', tier: 'budget', rank: 12, months: M.winterLong,
    tags: t(T.pilgrim, T.heritage, ['ghats', 'ganga-aarti', 'boat', 'sunrise', 'sarnath', 'street-food']),
    desc: 'The ghats at dawn from a boat, the evening aarti, and Sarnath a short drive out. Intense rather than restful.' },
  { slug: 'rameswaram', name: 'Rameswaram', state: 'Tamil Nadu', type: 'pilgrimage', tier: 'budget', rank: 37, months: M.winterLong,
    tags: t(T.pilgrim, T.budget, ['temple', 'island', 'pamban-bridge', 'dhanushkodi', 'sea']),
    desc: 'Island temple town reached over the Pamban bridge, with the abandoned shore of Dhanushkodi at the tip.' },
  { slug: 'amritsar', name: 'Amritsar', state: 'Punjab', type: 'pilgrimage', tier: 'budget', rank: 14, months: M.winterLong,
    tags: t(T.pilgrim, T.heritage, T.family, ['golden-temple', 'langar', 'wagah', 'street-food', 'jallianwala']),
    desc: 'The Golden Temple day and night, the Wagah border ceremony, and some of the best food in north India.' },
  { slug: 'kedarnath', name: 'Kedarnath & Char Dham', state: 'Uttarakhand', type: 'pilgrimage', tier: 'mid', rank: 38, months: M.himalSummer,
    tags: t(T.pilgrim, T.snow, T.adventure, ['trekking', 'temple', 'high-altitude', 'helicopter', 'yatra']),
    desc: 'The Himalayan Char Dham circuit, with the 16 km climb to Kedarnath at its heart. Open only in the summer window.' },
  { slug: 'shirdi', name: 'Shirdi', state: 'Maharashtra', type: 'pilgrimage', tier: 'budget', rank: 39, months: M.allYear,
    tags: t(T.pilgrim, T.budget, T.family, ['temple', 'darshan', 'shani-shingnapur']),
    desc: 'Sai Baba temple town, busy year round, usually combined with Shani Shingnapur and Nashik.' },
  { slug: 'bodh-gaya', name: 'Bodh Gaya', state: 'Bihar', type: 'pilgrimage', tier: 'budget', rank: 53, months: M.winterLong,
    tags: t(T.pilgrim, T.calm, ['buddhist', 'bodhi-tree', 'unesco', 'meditation', 'monastery', 'quiet']),
    desc: 'The Mahabodhi temple and the Bodhi tree, with monasteries built by every Buddhist nation around it.' },
  { slug: 'velankanni', name: 'Velankanni', state: 'Tamil Nadu', type: 'pilgrimage', tier: 'budget', rank: 54, months: M.winterLong,
    tags: t(T.pilgrim, T.budget, T.beach, ['basilica', 'coastal', 'festival']),
    desc: 'Coastal basilica drawing pilgrims of every faith, especially during the late-August festival.' },

  // ---------- Wildlife ----------
  { slug: 'jim-corbett', name: 'Jim Corbett', state: 'Uttarakhand', type: 'wildlife', tier: 'mid', rank: 41, months: M.winterLong,
    tags: t(T.wild, T.family, ['tiger', 'jeep-safari', 'river', 'forest-lodge', 'birding']),
    desc: "India's oldest national park — sal forest and the Ramganga river, with tiger, elephant and gharial." },
  { slug: 'ranthambore', name: 'Ranthambore', state: 'Rajasthan', type: 'wildlife', tier: 'premium', rank: 43, months: M.winterLong,
    tags: t(T.wild, T.heritage, T.family, ['tiger', 'jeep-safari', 'fort', 'photography', 'lakes']),
    desc: 'Dry deciduous park wrapped around a hilltop fort, with the best odds of a daylight tiger sighting in India.' },
  { slug: 'kaziranga', name: 'Kaziranga', state: 'Assam', type: 'wildlife', tier: 'mid', rank: 50, months: M.winterLong,
    tags: t(T.wild, ['rhino', 'elephant-safari', 'grassland', 'unesco', 'birding', 'tea']),
    desc: 'Brahmaputra floodplain grassland holding most of the world’s one-horned rhino, with tea estates alongside.' },
  { slug: 'thekkady', name: 'Thekkady (Periyar)', state: 'Kerala', type: 'wildlife', tier: 'mid', rank: 51, months: M.winterLong,
    tags: t(T.wild, T.calm, ['elephant', 'boat-safari', 'spice', 'bamboo-rafting', 'lake', 'forest']),
    desc: 'Lake safaris and bamboo rafting in Periyar, with cardamom and pepper estates on the road in.' },
  { slug: 'gir', name: 'Gir', state: 'Gujarat', type: 'wildlife', tier: 'mid', rank: 55, months: M.winterLong,
    tags: t(T.wild, ['asiatic-lion', 'jeep-safari', 'forest', 'birding']),
    desc: 'The only wild population of Asiatic lion, in dry teak forest with leopard and a long bird list.' },
  { slug: 'sundarbans', name: 'Sundarbans', state: 'West Bengal', type: 'wildlife', tier: 'mid', rank: 56, months: M.winterLong,
    tags: t(T.wild, T.calm, T.village, ['mangrove', 'boat', 'tiger', 'delta', 'unesco', 'slow']),
    desc: 'Tidal mangrove delta explored entirely by boat — swimming tigers, mudflats and villages on the fringe islands.' },

  // ---------- Adventure / nature ----------
  { slug: 'rishikesh', name: 'Rishikesh', state: 'Uttarakhand', type: 'adventure', tier: 'budget', rank: 10, months: M.winterLong,
    tags: t(T.adventure, T.pilgrim, T.calm, ['rafting', 'bungee', 'yoga', 'ganga-aarti', 'camping', 'ashram', 'meditation']),
    desc: 'Ganga rafting and bungee alongside yoga ashrams and the evening aarti at Triveni Ghat.' },
  { slug: 'meghalaya', name: 'Meghalaya (Shillong & Cherrapunji)', state: 'Meghalaya', type: 'nature', tier: 'mid', rank: 57, months: M.postMonsoon,
    tags: t(T.calm, T.village, T.adventure, ['waterfall', 'living-root-bridge', 'caves', 'rain', 'clean-village', 'trekking', 'cool']),
    desc: 'The wettest place on earth — root bridges grown from living fig, limestone caves, and Mawlynnong kept spotless by its village.' },
  { slug: 'ziro', name: 'Ziro Valley', state: 'Arunachal Pradesh', type: 'nature', tier: 'budget', rank: 58, months: M.postMonsoon,
    tags: t(T.calm, T.village, ['tribal', 'apatani', 'music-festival', 'paddy', 'remote', 'slow', 'homestay']),
    desc: 'Apatani paddy valley of pine ridges and bamboo homes, with a well-known independent music festival each September.' },

  // ---------- Metro ----------
  { slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', type: 'metro', tier: 'mid', rank: 9, months: M.winterLong,
    tags: t(T.city, T.heritage, T.family, ['marine-drive', 'elephanta', 'bollywood', 'street-food', 'nightlife', 'packed']),
    desc: 'Marine Drive, the Gateway, Elephanta caves by ferry, and food from every corner of the country.' },
  { slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', type: 'metro', tier: 'budget', rank: 8, months: M.winter,
    tags: t(T.city, T.heritage, ['durga-puja', 'tram', 'coffee-house', 'street-food', 'colonial', 'books']),
    desc: 'Trams, the Victoria Memorial, College Street bookshops, and Durga Puja if you can time it.' },
  { slug: 'hyderabad', name: 'Hyderabad', state: 'Telangana', type: 'metro', tier: 'budget', rank: 7, months: M.winterLong,
    tags: t(T.city, T.heritage, T.family, ['charminar', 'golconda', 'biryani', 'pearls', 'ramoji']),
    desc: 'Golconda fort, the Charminar bazaars, and biryani that justifies the flight by itself.' },
  { slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', type: 'metro', tier: 'mid', rank: 6, months: M.allYear,
    tags: t(T.city, T.family, ['gardens', 'cafe', 'brewery', 'palace', 'shopping', 'weekend', 'cool']),
    desc: 'Lalbagh and Cubbon Park, a heavy cafe and brewery scene, and the pleasantest big-city weather in India.' },

  // ---------- International ----------
  { slug: 'sri-lanka', name: 'Sri Lanka', country: 'Sri Lanka', type: 'heritage', tier: 'mid', rank: 60, months: M.winterLong,
    tags: t(T.beach, T.heritage, T.tea, T.calm, T.wild, ['train-journey', 'ella', 'sigiriya', 'temple', 'budget', 'village']),
    desc: 'Hill-country tea trains to Ella, the Sigiriya rock, southern beaches and leopards at Yala — all within short drives.' },
  { slug: 'nepal', name: 'Nepal (Kathmandu & Pokhara)', country: 'Nepal', type: 'adventure', tier: 'budget', rank: 61, months: M.postMonsoon,
    tags: t(T.snow, T.adventure, T.calm, T.village, T.pilgrim, ['trekking', 'annapurna', 'lake', 'stupa', 'budget', 'himalayas', 'tea-house']),
    desc: 'Kathmandu’s stupas and Pokhara’s lake beneath the Annapurna wall, with tea-house treks starting from the road head.' },
  { slug: 'bhutan', name: 'Bhutan', country: 'Bhutan', type: 'hill_station', tier: 'premium', rank: 62, months: M.postMonsoon,
    tags: t(T.snow, T.calm, T.village, ['monastery', 'tigers-nest', 'slow', 'sustainable', 'butter-tea', 'dzong', 'mountains']),
    desc: 'Dzongs above river valleys, the climb to Tiger’s Nest, and a daily fee that deliberately keeps visitor numbers low.' },
  { slug: 'vietnam', name: 'Vietnam', country: 'Vietnam', type: 'heritage', tier: 'budget', rank: 63, months: M.winterLong,
    tags: t(T.beach, T.heritage, T.budget, T.village, ['ha-long-bay', 'street-food', 'lantern', 'rice-terrace', 'motorbike', 'coffee']),
    desc: 'Ha Long limestone bays, Hoi An lanterns, northern rice terraces and the best cheap food in Southeast Asia.' },
  { slug: 'malaysia', name: 'Malaysia', country: 'Malaysia', type: 'metro', tier: 'mid', rank: 64, months: M.allYear,
    tags: t(T.city, T.beach, T.family, ['twin-towers', 'langkawi', 'cameron-highlands', 'tea', 'street-food', 'theme-park']),
    desc: 'Kuala Lumpur towers, Langkawi beaches and the Cameron Highlands tea estates, all easy with family.' },
  { slug: 'mauritius', name: 'Mauritius', country: 'Mauritius', type: 'island', tier: 'premium', rank: 65, months: M.winterLong,
    tags: t(T.beach, T.honeymoon, T.luxury, ['lagoon', 'catamaran', 'waterfall', 'resort', 'island', 'dolphins']),
    desc: 'Lagoon resorts, catamaran days, and a green volcanic interior of waterfalls and coloured earth.' },
  { slug: 'turkey', name: 'Turkey', country: 'Turkey', type: 'heritage', tier: 'premium', rank: 66, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    tags: t(T.heritage, T.honeymoon, ['cappadocia', 'balloon', 'hagia-sophia', 'bazaar', 'cave-hotel', 'tea', 'pamukkale']),
    desc: 'Balloons over Cappadocia at dawn, Istanbul across two continents, and Pamukkale’s white terraces.' },
  { slug: 'georgia', name: 'Georgia', country: 'Georgia', type: 'hill_station', tier: 'mid', rank: 67, months: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    tags: t(T.snow, T.calm, T.village, T.budget, ['caucasus', 'wine', 'kazbegi', 'monastery', 'mountains', 'hiking']),
    desc: 'Caucasus villages under snow peaks, 8,000 years of winemaking, and Tbilisi’s sulphur baths — cheap for Europe.' },
  { slug: 'almaty', name: 'Almaty & Kazakhstan', country: 'Kazakhstan', type: 'hill_station', tier: 'mid', rank: 68, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct', 'Dec', 'Jan'],
    tags: t(T.snow, T.adventure, T.budget, ['big-almaty-lake', 'skiing', 'shymbulak', 'mountains', 'cold', 'visa-free']),
    desc: 'Snow peaks straight off the city edge — Shymbulak skiing, the turquoise Big Almaty Lake, and short flights from India.' },
  { slug: 'baku', name: 'Baku & Azerbaijan', country: 'Azerbaijan', type: 'metro', tier: 'mid', rank: 69, months: ['Apr', 'May', 'Jun', 'Sep', 'Oct'],
    tags: t(T.city, T.heritage, T.budget, ['flame-towers', 'old-city', 'caspian', 'mud-volcano', 'gabala']),
    desc: 'Flame Towers over a walled old city on the Caspian, with mountain Gabala and mud volcanoes within a day.' },
  { slug: 'egypt', name: 'Egypt', country: 'Egypt', type: 'heritage', tier: 'premium', rank: 70, months: M.winterLong,
    tags: t(T.heritage, ['pyramids', 'nile-cruise', 'luxor', 'desert', 'museum', 'diving', 'warm']),
    desc: 'Giza pyramids, a Nile cruise between Luxor and Aswan, and Red Sea diving at the end.' },
  { slug: 'kenya', name: 'Kenya', country: 'Kenya', type: 'wildlife', tier: 'luxury', rank: 71, months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    tags: t(T.wild, T.luxury, ['masai-mara', 'migration', 'big-five', 'balloon-safari', 'savannah', 'photography']),
    desc: 'The Masai Mara during the wildebeest migration, with balloon safaris at first light and the Big Five.' },
  { slug: 'iceland', name: 'Iceland', country: 'Iceland', type: 'nature', tier: 'luxury', rank: 72, months: ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Feb', 'Mar'],
    tags: t(T.snow, T.calm, ['northern-lights', 'glacier', 'volcano', 'waterfall', 'hot-spring', 'cold', 'landscapes', 'road-trip']),
    desc: 'Glacier lagoons, black beaches and geothermal pools, with aurora on clear winter nights.' },
  { slug: 'norway', name: 'Norway', country: 'Norway', type: 'nature', tier: 'luxury', rank: 73, months: ['Jun', 'Jul', 'Aug', 'Sep', 'Feb', 'Mar'],
    tags: t(T.snow, T.calm, T.village, ['fjord', 'northern-lights', 'tromso', 'train-journey', 'cold', 'mountains', 'landscapes']),
    desc: 'Fjord villages under snow walls, the Flåm railway, and aurora above Tromsø in winter.' },
  { slug: 'lapland', name: 'Finnish Lapland', country: 'Finland', type: 'nature', tier: 'luxury', rank: 74, months: ['Dec', 'Jan', 'Feb', 'Mar'],
    tags: t(T.snow, T.calm, T.family, T.village, ['northern-lights', 'glass-igloo', 'husky', 'reindeer', 'santa', 'cold', 'sauna']),
    desc: 'Glass igloos under the aurora, husky and reindeer sledding, and snow on the ground for months.' },
  { slug: 'new-zealand', name: 'New Zealand', country: 'New Zealand', type: 'nature', tier: 'luxury', rank: 75, months: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    tags: t(T.snow, T.adventure, T.calm, T.village, ['fjord', 'glacier', 'bungee', 'queenstown', 'road-trip', 'landscapes', 'mountains']),
    desc: 'Southern Alps, Milford Sound, and Queenstown as a base for every adventure sport that exists.' },
  { slug: 'cambodia', name: 'Cambodia', country: 'Cambodia', type: 'heritage', tier: 'budget', rank: 76, months: M.winterLong,
    tags: t(T.heritage, T.budget, T.village, ['angkor-wat', 'sunrise', 'temple', 'floating-village', 'tuk-tuk']),
    desc: 'Angkor at sunrise and the Bayon faces, with floating villages on the Tonlé Sap nearby.' },
  { slug: 'seychelles', name: 'Seychelles', country: 'Seychelles', type: 'island', tier: 'luxury', rank: 77, months: ['Apr', 'May', 'Oct', 'Nov'],
    tags: t(T.beach, T.honeymoon, T.luxury, T.calm, ['granite-boulders', 'island-hopping', 'snorkelling', 'private', 'lagoon']),
    desc: 'Granite boulder beaches on Praslin and La Digue, reached by short island ferries. Quiet and expensive.' },
];

// ---------------------------------------------------------------------------
// Package themes
//
// `suits` gates a theme to destinations it makes sense for, so the catalogue
// does not end up offering a Honeymoon Retreat in Shirdi or a Wildlife Safari
// in Dubai.
// ---------------------------------------------------------------------------

interface Theme {
  key: string;
  title: (d: Dest) => string;
  days: [number, number];
  /** Multiplier on the tier day-rate. */
  mult: number;
  bestFor: string;
  travellerType: string[];
  angle: string;
  inclusions: string[];
  /** Any tag or type match qualifies the destination. */
  suits: string[];
  /** Never offer this theme at destinations carrying these tags. */
  avoid?: string[];
}

const THEMES: Theme[] = [
  { key: 'weekend', title: (d) => `${d.name} Weekend Break`, days: [2, 3], mult: 1.0,
    bestFor: 'Short Breaks, Friends', travellerType: ['solo', 'friends', 'couples'],
    angle: 'A short break built around the essentials, with travel timed so you lose no working days.',
    inclusions: ['Return transfers', 'Accommodation', 'Daily breakfast', 'Sightseeing as per itinerary'],
    suits: ['weekend', 'hill_station', 'beach', 'metro', 'heritage'] },

  { key: 'family', title: (d) => `${d.name} Family Holiday`, days: [4, 7], mult: 1.15,
    bestFor: 'Family, Children', travellerType: ['family'],
    angle: 'Paced for children and grandparents alike, with shorter travel days and family rooms throughout.',
    inclusions: ['Family rooms', 'Daily breakfast and dinner', 'Private vehicle', 'Entry tickets', 'Trip coordinator on call'],
    suits: ['family', 'beach', 'hill_station', 'wildlife', 'metro', 'heritage', 'island'],
    avoid: ['high-altitude', 'remote'] },

  { key: 'honeymoon', title: (d) => `${d.name} Honeymoon Escape`, days: [4, 7], mult: 1.45,
    bestFor: 'Honeymoon, Couples', travellerType: ['couples', 'honeymoon'],
    angle: 'Private transfers, a room with the view worth paying for, and one candlelit dinner arranged on us.',
    inclusions: ['Premium stay with view', 'Candlelight dinner', 'Private transfers', 'Flowers and cake on arrival', 'Couple spa session'],
    suits: ['honeymoon', 'couples', 'beach', 'island', 'hill_station', 'backwaters'] },

  { key: 'budget', title: (d) => `${d.name} on a Budget`, days: [3, 5], mult: 0.68,
    bestFor: 'Budget, Solo, Students', travellerType: ['solo', 'friends', 'students'],
    angle: 'Clean, simple stays and shared transfers. Everything essential, nothing decorative.',
    inclusions: ['Budget stay', 'Daily breakfast', 'Shared transfers', 'Local guide for one day'],
    suits: ['budget', 'backpacking', 'hill_station', 'beach', 'heritage', 'pilgrimage', 'adventure'] },

  { key: 'luxury', title: (d) => `${d.name} Luxury Retreat`, days: [4, 8], mult: 2.3,
    bestFor: 'Luxury, Couples', travellerType: ['couples', 'luxury'],
    angle: 'The best available property, a car and driver for the duration, and everything booked ahead so nothing is queued for.',
    inclusions: ['5-star or boutique stay', 'All meals', 'Dedicated car and chauffeur', 'Priority entries', 'Airport lounge access'],
    suits: ['luxury', 'island', 'beach', 'backwaters', 'wildlife', 'heritage', 'hill_station'] },

  { key: 'slow', title: (d) => `${d.name} Slow Travel`, days: [5, 9], mult: 1.05,
    bestFor: 'Slow Travel, Solo, Couples', travellerType: ['solo', 'couples', 'seniors'],
    angle: 'One base, long stays, no dawn departures. Built for people who want to sit still somewhere beautiful.',
    inclusions: ['Single-base stay', 'Daily breakfast', 'Two guided walks', 'Flexible unscheduled days'],
    suits: ['calm', 'peaceful', 'slow', 'village', 'homestay', 'backwaters', 'hill_station'] },

  { key: 'village', title: (d) => `${d.name} Village & Homestay Experience`, days: [4, 7], mult: 1.1,
    bestFor: 'Culture, Slow Travel', travellerType: ['solo', 'couples', 'family'],
    angle: 'Nights in family homestays rather than hotels, meals cooked by your hosts, and time in the kitchen if you want it.',
    inclusions: ['Village homestay', 'All home-cooked meals', 'Cooking session with hosts', 'Village walk with a local', 'Local transport'],
    suits: ['village', 'homestay', 'tea', 'coffee', 'tribal', 'slow'] },

  { key: 'trek', title: (d) => `${d.name} Trekking Expedition`, days: [5, 9], mult: 1.2,
    bestFor: 'Adventure, Trekking', travellerType: ['solo', 'friends', 'adventure'],
    angle: 'Graded day walks with a certified guide, camping or tea-house nights, and acclimatisation built into the plan.',
    inclusions: ['Certified trek guide', 'Camping or tea-house stay', 'All meals on trek', 'Permits', 'Safety and oxygen kit'],
    suits: ['trekking', 'adventure', 'mountains', 'snow', 'high-altitude'] },

  { key: 'pilgrim', title: (d) => `${d.name} Pilgrimage Circuit`, days: [3, 6], mult: 0.95,
    bestFor: 'Pilgrimage, Devotion', travellerType: ['family', 'seniors', 'pilgrimage'],
    angle: 'Darshan timings planned around crowds, vegetarian meals throughout, and assistance for elderly travellers.',
    inclusions: ['Darshan assistance', 'Vegetarian meals', 'Accommodation near the temple', 'Priest coordination', 'Wheelchair support on request'],
    suits: ['pilgrimage', 'temples', 'spiritual'] },

  { key: 'wildlife', title: (d) => `${d.name} Wildlife Safari`, days: [3, 6], mult: 1.35,
    bestFor: 'Wildlife, Photography', travellerType: ['family', 'couples', 'photography'],
    angle: 'Two safaris a day in the productive hours, with a naturalist who knows the territories.',
    inclusions: ['Jeep safaris with naturalist', 'Forest lodge stay', 'All meals', 'Park fees and permits', 'Binoculars provided'],
    suits: ['wildlife', 'safari', 'tiger', 'rhino', 'asiatic-lion', 'mangrove'] },

  { key: 'wellness', title: (d) => `${d.name} Wellness & Ayurveda Retreat`, days: [5, 10], mult: 1.5,
    bestFor: 'Wellness, Solo', travellerType: ['solo', 'couples', 'seniors'],
    angle: 'A consultation on arrival, then a daily therapy schedule with meals matched to it.',
    inclusions: ['Doctor consultation', 'Daily therapies', 'Prescribed diet', 'Yoga and meditation sessions', 'Wellness resort stay'],
    suits: ['ayurveda', 'yoga', 'meditation', 'wellness', 'calm', 'backwaters'] },

  { key: 'photo', title: (d) => `${d.name} Photography Tour`, days: [4, 8], mult: 1.25,
    bestFor: 'Photography, Landscapes', travellerType: ['solo', 'friends', 'photography'],
    angle: 'Itinerary built around light — pre-dawn starts, golden hour at the right viewpoints, and a photographer leading.',
    inclusions: ['Photographer guide', 'Sunrise and sunset positioning', 'Private vehicle with flexible timing', 'Accommodation', 'Location permits'],
    suits: ['photography', 'landscapes', 'heritage', 'wildlife', 'snow', 'desert', 'northern-lights'] },

  { key: 'senior', title: (d) => `${d.name} Senior Citizens Special`, days: [4, 8], mult: 1.3,
    bestFor: 'Seniors, Leisure', travellerType: ['seniors', 'family'],
    angle: 'Ground-floor rooms, no more than three hours travel a day, and a doctor on call throughout.',
    inclusions: ['Accessible ground-floor rooms', 'All meals, diet-adjusted', 'Doctor on call', 'Wheelchair assistance', 'Unhurried daily schedule'],
    suits: ['pilgrimage', 'heritage', 'backwaters', 'hill_station', 'metro', 'calm'],
    avoid: ['high-altitude', 'trekking', 'remote'] },

  { key: 'foodie', title: (d) => `${d.name} Food Trail`, days: [3, 5], mult: 1.1,
    bestFor: 'Food, Culture', travellerType: ['friends', 'couples', 'solo'],
    angle: 'Guided eating — street stalls, an old family kitchen, a market walk and one cooking class.',
    inclusions: ['Guided food walks', 'Cooking class', 'Market visit', 'Accommodation', 'All tastings'],
    suits: ['street-food', 'biryani', 'seafood', 'metro', 'culture', 'coffee', 'tea'] },

  { key: 'corporate', title: (d) => `${d.name} Corporate Offsite`, days: [2, 4], mult: 1.55,
    bestFor: 'Corporate, Teams', travellerType: ['corporate'],
    angle: 'Conference room and reliable wifi in the mornings, structured team activity in the afternoons.',
    inclusions: ['Conference facilities', 'High-speed wifi', 'All meals', 'Team-building activities', 'Group transfers', 'Event coordinator'],
    suits: ['metro', 'beach', 'hill_station', 'resort', 'adventure'] },

  { key: 'monsoon', title: (d) => `${d.name} Monsoon Special`, days: [3, 5], mult: 0.85,
    bestFor: 'Monsoon, Couples', travellerType: ['couples', 'solo', 'friends'],
    angle: 'Off-season rates when the hills are greenest, with indoor alternatives held in reserve for the wettest days.',
    inclusions: ['Off-season rates', 'Accommodation', 'Daily breakfast', 'Waterfall visits', 'Indoor backup plan'],
    suits: ['waterfall', 'rain', 'misty', 'nature', 'forest', 'tea', 'coffee'] },
];

// ---------------------------------------------------------------------------
// Pricing
//
// Per-person, per-day, before the theme multiplier. Real rate cards are not
// round, so a deterministic jitter is applied — the original 21 packages all
// ended in 000 or 500, which is how we knew they were placeholders.
// ---------------------------------------------------------------------------
const DAY_RATE: Record<Tier, [number, number]> = {
  budget: [1800, 2600],
  mid: [3200, 4600],
  premium: [6000, 8500],
  luxury: [11000, 17000],
};
const INTERNATIONAL_UPLIFT = 2.35;

function priceFor(dest: Dest, theme: Theme, days: number): number {
  const [lo, hi] = DAY_RATE[dest.tier];
  const rate = lo + rng() * (hi - lo);
  const international = (dest.country ?? 'India') !== 'India';
  const raw = rate * days * theme.mult * (international ? INTERNATIONAL_UPLIFT : 1);
  // Land on a credible retail figure: nearest 10, nudged off the round number.
  const jittered = raw * (0.94 + rng() * 0.12);
  const rounded = Math.round(jittered / 10) * 10;
  return rounded % 500 === 0 ? rounded + pick([-40, -30, 30, 40, 90]) : rounded;
}

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function suitsDestination(theme: Theme, dest: Dest): boolean {
  const bag = new Set([...dest.tags, dest.type]);
  if (theme.avoid?.some((a) => bag.has(a))) return false;
  return theme.suits.some((s) => bag.has(s));
}

async function main() {
  const pool = getPool();
  console.log(`Seeding DEMO catalogue (seed=${argOf('seed', 1337)})\n`);

  let destCount = 0;
  let pkgCount = 0;

  await withTransaction(async (c) => {
    for (const dest of DESTINATIONS) {
      const { rows } = await c.query<{ id: string }>(
        `INSERT INTO destinations
           (slug, name, state, country, destination_type, description,
            popularity_rank, best_months, tags, data_source)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'REAL_PUBLIC')
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name, description = EXCLUDED.description,
           destination_type = EXCLUDED.destination_type,
           best_months = EXCLUDED.best_months, tags = EXCLUDED.tags,
           updated_at = now()
         RETURNING id`,
        [dest.slug, dest.name, dest.state ?? null, dest.country ?? 'India',
         dest.type, dest.desc, dest.rank, dest.months, JSON.stringify(dest.tags)]
      );
      const destinationId = Number(rows[0].id);
      destCount++;

      const eligible = THEMES.filter((th) => suitsDestination(th, dest));
      // 2-5 packages each: enough breadth to answer varied queries without
      // burying every destination under sixteen near-identical rows.
      const chosen = eligible.slice(0, Math.min(eligible.length, randInt(2, 5)));

      for (const theme of chosen) {
        const days = randInt(theme.days[0], theme.days[1]);
        const nights = days - 1;
        const price = priceFor(dest, theme, days);
        const id = `dem-${dest.slug}-${theme.key}`;

        await c.query(
          `INSERT INTO packages
             (id, title, category, duration, best_for, starting_price, price_inr,
              description, image_url, destination_id, duration_days,
              duration_nights, traveller_type, inclusions, exclusions,
              status, is_composable, data_source)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,$9,$10,$11,$12,$13,$14,
                   'active', false, 'DEMO')
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title, duration = EXCLUDED.duration,
             best_for = EXCLUDED.best_for, starting_price = EXCLUDED.starting_price,
             price_inr = EXCLUDED.price_inr, description = EXCLUDED.description,
             destination_id = EXCLUDED.destination_id,
             duration_days = EXCLUDED.duration_days,
             duration_nights = EXCLUDED.duration_nights,
             traveller_type = EXCLUDED.traveller_type,
             inclusions = EXCLUDED.inclusions, exclusions = EXCLUDED.exclusions`,
          [
            id,
            theme.title(dest),
            (dest.country ?? 'India') === 'India' ? 'India' : 'International',
            `${nights} Night${nights === 1 ? '' : 's'} / ${days} Days`,
            theme.bestFor,
            inr(price),
            price,
            `${theme.angle} ${dest.desc}`,
            destinationId,
            days,
            nights,
            theme.travellerType,
            JSON.stringify(theme.inclusions),
            JSON.stringify(['Airfare unless stated', 'Personal expenses', 'Travel insurance', 'Anything not listed under inclusions']),
          ]
        );
        pkgCount++;
      }
    }
  });

  await pool.query('ANALYZE');

  const stats = await pool.query<{ label: string; n: string }>(
    `SELECT 'destinations' AS label, count(*)::text AS n FROM destinations
     UNION ALL SELECT 'packages total', count(*)::text FROM packages
     UNION ALL SELECT 'packages linked', count(destination_id)::text FROM packages
     UNION ALL SELECT 'demo packages', count(*)::text FROM packages WHERE data_source='DEMO'`
  );

  console.log(`  destinations upserted : ${destCount}`);
  console.log(`  packages generated    : ${pkgCount}\n`);
  for (const s of stats.rows) console.log(`  ${s.label.padEnd(18)} ${s.n}`);

  const bands = await pool.query<{ band: string; n: string }>(
    `SELECT CASE
              WHEN price_inr < 10000 THEN 'under 10k'
              WHEN price_inr < 25000 THEN '10k-25k'
              WHEN price_inr < 60000 THEN '25k-60k'
              WHEN price_inr < 150000 THEN '60k-150k'
              ELSE '150k+'
            END AS band, count(*)::text AS n
     FROM packages WHERE price_inr IS NOT NULL
     GROUP BY 1 ORDER BY min(price_inr)`
  );
  console.log('\n  price bands:');
  for (const b of bands.rows) console.log(`    ${b.band.padEnd(10)} ${b.n}`);

  const round = await pool.query<{ n: string; total: string }>(
    `SELECT count(*) FILTER (WHERE price_inr % 500 = 0)::text AS n,
            count(*)::text AS total
     FROM packages WHERE price_inr IS NOT NULL`
  );
  console.log(`\n  prices ending in 000/500: ${round.rows[0].n} of ${round.rows[0].total}`);
}

main()
  .catch((err) => {
    console.error('\nCatalogue seed failed:\n', err);
    process.exit(1);
  })
  .finally(closePool);
