import { prisma } from '@/lib/db'
import { LobbyIntensity } from '@prisma/client'
import { slugify } from '@/lib/utils'

interface CampaignTemplate {
  title: string
  tagline: string
  description: string
  category: string
  targetPrice: number
  lobbyCount: number
  lobbyIntensities: LobbyIntensity[]
}

const campaigns: CampaignTemplate[] = [
  {
    title: 'Modular Standing Desk with Integrated Cable Management',
    tagline: 'The workspace you can actually organize',
    description: `Tired of tangled cables ruining your clean desk aesthetic? This modular standing desk system features revolutionary built-in cable management that keeps cords hidden, organized, and easily accessible. Each segment of the desk includes snap-fit cable channels that route along the underside, with port doors that open smoothly for quick access. The desk adjusts electronically from 28" to 48" height, perfect for sitting or standing work. The modular top sections let you customize your workspace—combine two 48" sections for a sprawling creative studio, or go compact with a single 30" section. The memory-preset system saves your favorite heights. Built from sustainable hardwood with a recyclable aluminum frame, it's designed to last decades.`,
    category: 'Tech',
    targetPrice: 1200,
    lobbyCount: 18,
    lobbyIntensities: ['TAKE_MY_MONEY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'PROBABLY_BUY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA'],
  },
  {
    title: 'AI-Powered Plant Care Sensor with Smart Notifications',
    tagline: 'Your plants will never ghost you again',
    description: `Imagine never killing a plant again. This intelligent sensor nestles into your soil and monitors moisture, light, temperature, and soil nutrients in real-time. Using machine learning trained on thousands of plant species, it sends you text messages with specific care instructions tailored to your exact plant. "Your monstera needs water in 2 days—add 1 cup" instead of generic reminders. The sleek waterproof disc is nearly invisible in the pot, connected via secure Bluetooth to the mobile app and a home gateway. It even predicts pest problems before they start and suggests remedies. The ceramic coating protects delicate roots, and the sensor lasts 18 months on a single charge. Perfect for busy professionals and plant enthusiasts alike.`,
    category: 'Home',
    targetPrice: 45,
    lobbyCount: 22,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Sustainable Phone Case - Fully Biodegradable in 24 Months',
    tagline: 'Protect your phone. Protect the planet.',
    description: `What if your phone case could literally become soil? This groundbreaking case is made from plant-based biopolymers that fully biodegrade within 24 months when composted, breaking down into harmless organic matter. But don't let the eco-friendly material fool you—it provides military-grade drop protection up to 6 feet and 360-degree edge cushioning. The case comes in 12 stunning colors, all produced using renewable resources. When you're done with it, toss it into any commercial compost facility and it vanishes completely, leaving zero microplastics behind. The manufacturing process uses 90% less water than traditional cases. Meanwhile, it's 15% thinner than competitors while maintaining superior grip thanks to a micro-textured surface. Available for all major phone models.`,
    category: 'Sustainability',
    targetPrice: 28,
    lobbyCount: 20,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Smart Water Bottle - Hydration Tracking & AI Reminders',
    tagline: 'Drink water. Actually stay hydrated.',
    description: `Dehydration sneaks up on you without warning—affecting energy, focus, and health. This smart water bottle uses capacitive sensors to track every sip and measures consumption in real-time via its companion app. But here's the magic: the AI learns your patterns and sends perfectly-timed notifications. Exercise detected? Prompts you to hydrate more aggressively. Working deep in focus? Gentle reminders every 45 minutes. The 24oz bottle is vacuum-insulated, keeping water ice-cold for 24 hours or steaming hot for 12 hours. It syncs seamlessly with fitness trackers and health apps like Apple Health and Google Fit. The base glows softly when you need more water, and the app shows beautiful visualizations of your weekly hydration trends. Lightweight and durable, it's perfect for athletes, desk workers, and anyone who forgets to drink enough water.`,
    category: 'Health',
    targetPrice: 65,
    lobbyCount: 19,
    lobbyIntensities: ['PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Ultra-Thin Noise-Cancelling Sleep Earbuds',
    tagline: 'The thinnest earbuds designed for side sleepers',
    description: `Side sleepers suffer through standard earbuds that dig into ears and fall out. These revolutionary sleep earbuds are only 6mm thin—flatter than a coin when sitting in your ear. They're designed with a unique asymmetrical shape that curves perfectly to the side of your head, letting you sleep comfortably without pressure points. Active noise cancellation eliminates white noise and ambient sounds, while retaining ambient aware mode so you can hear alarms or your partner. They're loaded with sleep-focused features: binaural beats to help you fall asleep, sleep tracking that monitors duration and quality, and gentle wake-up vibrations that don't jolt you awake. The battery lasts 8 hours on a charge. The charging case is incredibly compact—smaller than a car key fob. Premium silicone ear tips come in five sizes for a perfect seal. FDA-cleared for safe nightly use.`,
    category: 'Health',
    targetPrice: 180,
    lobbyCount: 16,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY'],
  },
  {
    title: 'Smart Dog Collar - GPS Tracking + Health Monitoring',
    tagline: 'Know where your dog is. Know how your dog is.',
    description: `Every dog owner's worst fear is losing their best friend. This advanced collar combines real-time GPS tracking with comprehensive health monitoring. The collar uses cellular connectivity (not just Bluetooth, so it works even when your dog wanders far away) to show your dog's location updated every 30 seconds on a real-time map. Lost pet? Alert nearby users instantly. The health side is equally impressive: built-in sensors monitor heart rate, temperature, and activity levels, alerting you immediately if something seems wrong. Unusual heat spike? Possible fever. Strange inactivity? Possible injury. The waterproof collar is lightweight at just 2.2oz and lasts 7 days per charge. It's compatible with any collar size thanks to adjustable attachment bands. The app shows detailed daily activity patterns and health trends. Geofencing features alert you if your dog leaves safe zones. Most importantly, it's quiet—no annoying beeping, just silent protection.`,
    category: 'Pets',
    targetPrice: 240,
    lobbyCount: 17,
    lobbyIntensities: ['TAKE_MY_MONEY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA'],
  },
  {
    title: 'Portable Espresso Maker with Self-Heating Technology',
    tagline: 'Café-quality espresso anywhere—no outlet needed',
    description: `Coffee lovers who travel, hike, or work from offices without a decent machine deserve better than instant coffee. This ingenious portable espresso maker uses an innovative self-heating water chamber that reaches 195°F (90°C) using an integrated heating element—powered by a rechargeable battery, not electricity. Press a button and within 20 seconds, you're extracting rich, crema-topped espresso shots. The 3-bar pressure system (comparable to basic home machines) extracts full-bodied shots from freshly ground beans. The entire device fits in your backpack—it's smaller than a water bottle. Included are two reusable stainless steel baskets (single and double shot) and a milk frother attachment for cappuccinos. Battery lasts for 8 full espresso shots on a single charge. The ceramic heating chamber prevents metallic taste. You control the extraction—no guessing or pre-programmed shots. Made by espresso enthusiasts, for espresso enthusiasts.`,
    category: 'Food',
    targetPrice: 85,
    lobbyCount: 14,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'UV-C Sanitising Phone Charger Pad',
    tagline: 'Charge and disinfect simultaneously',
    description: `Your phone touches your face 96 times per day on average, and it's covered in 25,000 bacteria per square inch—more than a toilet seat. This innovative charging pad uses FDA-approved UV-C light technology to kill 99.99% of bacteria, viruses, and fungi while your phone charges wirelessly. The process takes just 30 minutes, eliminating pathogens including E. coli, MRSA, and coronaviruses. The pad features 8 powerful UV-C LEDs that activate only when the protective cover is closed (completely safe—no light exposure). Your phone charges at standard 15W speed while being sanitized. The minimalist design looks like a regular charging pad and fits seamlessly into bedside tables or desks. It's compatible with all Qi-enabled phones and includes a microfiber cloth for manual cleaning. Medical-grade safety testing confirms zero harmful effects on phone materials or batteries. Hospitals, clinics, and health-conscious families are already using these.`,
    category: 'Tech',
    targetPrice: 55,
    lobbyCount: 15,
    lobbyIntensities: ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Bamboo Fibre Everyday Sneakers - 100% Sustainable',
    tagline: 'Comfort that doesn\'t cost the planet',
    description: `Fashion meets sustainability with these elegant, durable sneakers made from rapidly-renewable bamboo fiber. Unlike conventional cotton (which requires massive water and pesticide use), bamboo grows without fertilizers and regenerates in just 3-5 years. These sneakers look like premium street style—clean minimalist design available in 8 colors—while feeling like walking on clouds. The sole uses recycled ocean-bound plastic and mycelium-based foam (grown from mushroom roots). The insole is biodegradable coconut husk. Weight is just 7.2 oz per shoe, lighter than standard sneakers. Breathable mesh keeps feet cool, while the arch support is engineered for 8+ hours of comfort. They arrive in a plantable seed paper box that grows wildflowers when buried. Vegan, cruelty-free, and certified carbon-negative to manufacture. Perfect for everyday wear, travel, or workouts. Available in men's and women's sizes.`,
    category: 'Fashion',
    targetPrice: 92,
    lobbyCount: 13,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Smart Kitchen Compost Bin with Odour Lock',
    tagline: 'Composting without the smell or mess',
    description: `Composting at home is amazing for the environment but terrible if your kitchen smells like a landfill. This smart bin solves that completely with a hermetically sealed lid that only opens when you approach (motion detection), then locks immediately after use. The stainless steel interior is coated with food-grade antimicrobial protection. Deodorizing carbon filters eliminate smells before they escape—far more effective than spraying vinegar around. The bin monitors compost breakdown using temperature and moisture sensors, alerting you via app when it's full (about 1 gallon of food scraps, or roughly weekly). The app provides composition tips and sustainability impact tracking—you can literally see how much landfill waste you're preventing. Built-in weight scale helps portion scraps properly. When full, you carry the lightweight container to your outdoor compost bin or collection service. Made from recycled aluminum with a minimalist design that looks like a luxury kitchen appliance, not waste management.`,
    category: 'Sustainability',
    targetPrice: 140,
    lobbyCount: 12,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA'],
  },
  {
    title: 'Magnetic Modular Spice Rack System',
    tagline: 'Organize your spices, reclaim your kitchen',
    description: `Spice drawers are chaos—bottles rolling around, labels fading, expiration dates ignored. This ingenious system transforms spice storage into a sleek, organized display. Individual magnetic spice containers come in glass or recycled plastic, holding the perfect amount of commonly used spices. The aluminum rail system mounts on any kitchen wall (or magnetic strips attach to the fridge), and containers stick magnetically in any arrangement. Labels are engraved directly on the metal lids—they'll never fade or peel. Each container has a top-opening design with a pour spout, perfect for shaking directly into pots. The system is modular—start with 12 essential spices and expand as your cooking skills grow. No more buying massive bottles you only use twice per year. Each refillable container costs just $3, and organic, ethically-sourced spices can be purchased directly through the companion app. Compact enough for studio apartments, scalable enough for professional kitchen enthusiasts. Reduces food waste from expired spices by 60%.`,
    category: 'Home',
    targetPrice: 78,
    lobbyCount: 11,
    lobbyIntensities: ['TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA'],
  },
  {
    title: 'Kids\' Tablet with AI-Powered Parental Controls',
    tagline: 'Screen time that actually educates and protects',
    description: `Parents face impossible choices: let kids use tablets unsupervised and worry about inappropriate content, or ban screens entirely. This purpose-built kids' tablet finds the perfect balance. The custom child-safe OS blocks inappropriate content at multiple levels—keyword filtering, age-gating, and AI content analysis that learns your family's values. The tablet auto-detects when your child transitions from educational content to entertainment and adjusts screen time limits intelligently. Parents set daily limits in the app, but the device respects "productive hours"—educational apps don't count toward limits, so learning is never penalized. 60FPS performance keeps everything smooth for gaming and video, while the 8-inch display is sized perfectly for young hands. Drop-tested to survive concrete, with fully washable ports. The 12-hour battery lets kids take learning anywhere. No ads, no data collection, no dark patterns. Annual subscription includes content curation from educators and curated app library with thousands of educational experiences. Built-in parental dashboards show what kids are learning and engaging with.`,
    category: 'Kids',
    targetPrice: 280,
    lobbyCount: 10,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Solar-Powered Portable Bluetooth Speaker',
    tagline: 'Music anywhere—powered by the sun',
    description: `Imagine a speaker that never runs out of battery, no matter how far from civilization you travel. This rugged Bluetooth speaker features a high-efficiency solar panel that charges while you listen, meaning unlimited playtime in sunlight. The monocrystalline solar cells are incredibly efficient—even on cloudy days they deliver meaningful charge. The 6000mAh battery stores energy for 12 hours of playback in a single full charge, or 2+ weeks of continuous operation with daily sunlight. 360-degree sound with 30W of peak output fills large outdoor spaces. The speaker is truly portable—only 800g (1.8 lbs)—and shockproof with a weather-resistant rating of IP67. Aluminum and recycled plastic construction handles drops and impacts. Includes carabiner for backpack attachment. Dual stereo connection lets two speakers pair together for even bigger sound. Perfect for camping, beach trips, hiking, and off-grid festivals. The audio quality rivals much larger powered speakers, with punchy bass and crisp highs across the frequency spectrum.`,
    category: 'Tech',
    targetPrice: 110,
    lobbyCount: 13,
    lobbyIntensities: ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA'],
  },
  {
    title: 'Protein-Enriched Pasta - 30g Protein Per Serving',
    tagline: 'Healthy eating shouldn\'t require meal prep',
    description: `Traditional pasta is 95% carbs and empty calories. This revolutionary pasta delivers a complete nutritional profile—30g of plant-based protein per 100g serving, plus complete amino acid chains. Made from a proprietary blend of lentil, chickpea, and whole grain, it tastes like premium Italian pasta while providing the macronutrient profile of a chicken breast. 8 grams of dietary fiber supports digestion. Cooks in 8 minutes just like regular pasta. The flavor is subtle and delicious—you won't taste the protein, just genuine pasta taste. Available in penne, spaghetti, and fusilli. Gluten-free and allergen-free. Each box serves 4 people and stores for 2+ years in the pantry. The nutrition facts would cost $15+ per serving in prepared meals or supplements. Perfect for busy professionals, athletes, and anyone trying to eat healthier without sacrificing taste or convenience. Competitive pasta prices—only 20% premium over conventional pasta despite offering 5x the protein.`,
    category: 'Food',
    targetPrice: 3.50,
    lobbyCount: 9,
    lobbyIntensities: ['PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Ergonomic Travel Pillow - Packs to Credit Card Size',
    tagline: 'Real sleep on planes, trains, and cars',
    description: `Travel pillows are a joke—most compress your neck at weird angles while taking up half your carry-on. This patent-pending design uses memory foam that's 8x more compressible than standard foam. It packs flat to the size of a credit card (0.5 inches thick, weighs 6 oz) yet expands to full neck support in seconds. The ergonomic shape cradles your neck with proper cervical alignment—studies show it increases sleep quality by 40% compared to pillow-less travel. The outer cover is ultra-soft bamboo fabric that regulates temperature (no more sweating into your pillow). Removable, washable cover. The memory foam is hypoallergenic and dust-mite resistant. Works for every sleep position and fits in airplane seat headers perfectly. Airplane mode tested for maximum comfort on ultra-narrow economy seats. The carrying pouch doubles as a storage bag for travel essentials. Travelers rate this 4.9 out of 5 stars. Orthopedists recommend it for anyone with neck pain or sleep issues. Available in three firmness levels.`,
    category: 'Travel',
    targetPrice: 42,
    lobbyCount: 8,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY'],
  },
  {
    title: 'Smart Mirror with AI Workout Guidance',
    tagline: 'Personal trainer in your bathroom',
    description: `Home fitness is convenient but lacks guidance—you end up doing exercises wrong, potentially injuring yourself or wasting time. This smart mirror includes real-time AI that watches your form and corrects it in real-time. The system uses computer vision (not cameras that record) to track your joint positions, muscle engagement, and movement patterns. During workouts, on-screen guidance overlays your body position with the correct form, with audio cues like "shoulders back" or "deepen your squat." The mirror offers 500+ guided workouts from gentle yoga to HIIT training, all adapted to your fitness level. It learns your preferences and suggests targeted routines. Progress tracking shows strength gains, flexibility improvements, and consistency metrics. The 32-inch 4K display provides crystal-clear video for follow-along classes. Integrated speakers deliver immersive audio. Built-in mic lets you communicate with live instructors during premium sessions. The sleek frameless design looks like a luxury home mirror when off. Scientifically shown to improve workout form accuracy by 78%.`,
    category: 'Fitness',
    targetPrice: 650,
    lobbyCount: 7,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Collapsible Electric Scooter - Fits in Your Backpack',
    tagline: 'The commute you\'ll actually enjoy',
    description: `Urban commuting is frustrating—cars cost a fortune, buses are unpredictable, and walking takes forever. Traditional scooters are bulky and awkward to carry. This revolutionary collapsible design folds into a 2-liter backpack-sized bundle (4.2 kg) that fits easily in most backpacks. It's not a toy—the dual 250W motors accelerate to 25 mph, with a 25-mile range on a single charge. The battery is genuinely swappable, so you can carry a spare for unlimited range. Dual disc brakes with regenerative recovery stop you safely even on hills. The deck is carbon fiber reinforced—lighter than aluminum but stronger. Handles both smooth streets and light off-road terrain. Impressive hill-climbing ability for steep urban streets. The unfolded platform is spacious and stable. Headlight and taillights keep you visible. Phone integration shows battery, route optimization, and speed telemetry. Folds and unfolds in 5 seconds. Insurance-friendly with built-in ID tracking. Police-approved for sidewalk use in most jurisdictions. Transforms your commute from dreading traffic to genuinely enjoying the ride.`,
    category: 'Tech',
    targetPrice: 480,
    lobbyCount: 10,
    lobbyIntensities: ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA'],
  },
  {
    title: 'Reusable Beeswax Food Wraps - Monthly Subscription Box',
    tagline: 'Goodbye plastic wrap, forever',
    description: `Single-use plastic wrap is one of the fastest-growing waste problems—most people wrap hundreds of items yearly without a second thought. These beeswax wraps are organic cotton infused with beeswax, jojoba oil, and tree resin. They stick to food and containers through natural adhesion (no chemicals), staying soft and moldable for years. One wrap replaces hundreds of plastic wrap sheets over its lifetime. Each set includes 5 wraps in varying sizes for everything from covering bowls to wrapping sandwiches. The subscription delivers fresh wraps quarterly—designs rotate seasonally. Old wraps are returned and composted (fully biodegradable after 3-6 months). The wax is sustainably sourced from ethical beekeepers. Wraps last 1+ year before needing replacement. Users report 90% reduction in kitchen plastic waste. Wash in cool water with mild soap, air dry, and they're ready for next use. The resin scent is pleasant and subtle. Vegan alternative available using plant-based waxes. Kids enjoy helping because the wraps are colorful and fun to use.`,
    category: 'Sustainability',
    targetPrice: 28,
    lobbyCount: 12,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA'],
  },
  {
    title: 'AI Budgeting App - Rounds Up Spare Change to Invest',
    tagline: 'Wealth building on autopilot',
    description: `Most people never save because willpower fails when bills arrive. This app removes willpower entirely through "painless" rounding. When you spend $4.27 on coffee, it rounds up to $5 and invests the $0.73 in your portfolio. Over time, this unconscious savings mechanism adds up to hundreds monthly. The AI learns your spending patterns and adjusts categories—it knows when you're traveling (fewer round-ups) or receiving bonuses (increases round-ups). It optimizes micro-investments across 50+ low-cost, high-performance index funds. Your money starts working immediately. The app integrates seamlessly with all major banks (read-only access, never touches transactions). Dashboard shows total saved, projected wealth at retirement, and detailed spending insights. The AI provides nudges to optimize spending without being preachy. Built-in education explains investing without jargon. No account minimums. Transparent 0.25% annual fee (far below industry standard). Users report building $1000+ emergency funds within 6 months. Perfect for millennials who want to invest but don't know where to start.`,
    category: 'Tech',
    targetPrice: 0,
    lobbyCount: 14,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Heated Insoles Controlled by Phone App',
    tagline: 'Warm feet, cold hands, finally balanced comfort',
    description: `Cold feet in winter are miserable—while wearing heavy coats. These smart heated insoles solve this elegantly. Ultrathin graphene heating elements embedded in the insole reach 115°F (46°C) within 90 seconds, providing targeted warmth exactly where you need it. Control temperature from your phone or voice assistant. Battery lasts 8 hours at medium heat, or 12+ hours on low. The rechargeable battery is integrated into a slim pouch that clips to socks—no bulky electronics. Motion sensors adjust heat automatically—high heat while walking, lower temperature while stationary. Perfect for winter sports, outdoor work, hiking, or just surviving commutes. Graphene heats evenly without hotspots or burns. Medical grade for safe skin contact—recommended by podiatrists. Works with any footwear. Waterproof up to shallow puddles. App shows battery status and provides custom heating programs (hiking mode, office mode, extreme cold mode). Users report feet staying warm and comfortable in conditions they'd normally abandon outdoor activities. Available in three sizes.`,
    category: 'Fitness',
    targetPrice: 95,
    lobbyCount: 9,
    lobbyIntensities: ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Modular Furniture System for Small Flats',
    tagline: 'Your apartment finally has enough storage',
    description: `Small apartments trap you in constant organization battles. This revolutionary modular system stacks vertically, maximizing space efficiency. Individual units (shelves, drawers, cubbies, closets) connect via hidden metal brackets, creating any configuration from floor to ceiling. The clean, minimal design uses light natural wood that makes small spaces feel larger. Cable management runs invisibly through the bracket system. Each unit is light enough for one person to rearrange alone—transform your living room in minutes. Cubbies perfectly fit standard storage boxes. Open shelving displays books and decorative items beautifully. Drawer units have full extension slides and soft close. Closet sections come with hanging rods and shelving. All materials are FSC certified sustainable wood. The modular design lets you expand over time—buy two units initially, add more as your life changes. Can be completely reconfigured when you move without tools. Designed by architects who live in studios. Realistic price point ($120-800 depending on configuration) fits actual budgets. Transforms depressing small spaces into organized, beautiful homes.`,
    category: 'Home',
    targetPrice: 450,
    lobbyCount: 11,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY'],
  },
  {
    title: 'Smart Pet Feeder with Camera and Portion Control',
    tagline: 'Feed your pet right, always',
    description: `Pet overfeeding is one of the leading causes of pet obesity. This smart feeder automatically dispenses measured portions—controlled by app or automated schedules. The integrated 1080p camera with night vision lets you watch your pet eat from anywhere. App notifications alert you when your pet approaches the feeder, so you'll know if they're sneaking extra meals. Portion control is down to the gram—customize portions for each pet in multi-pet households. The AI detects if food was thrown on the floor (so you can train better behavior) and suggests optimal portions based on your pet's weight and health profile. The food-grade stainless steel bowl is dishwasher safe. The 5-liter hopper reduces refills to weekly for most pets. Slow feeding mode extends meal duration for dogs prone to bloat. Whisper-quiet operation won't startle sensitive pets. The sealed storage compartment keeps food fresh for weeks. Temperature-controlled storage for premium wet foods. Pet health tracking integrates with vet records. Reduces food waste dramatically. Vet-approved and recommended for weight management programs.`,
    category: 'Pets',
    targetPrice: 175,
    lobbyCount: 10,
    lobbyIntensities: ['TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY'],
  },
  {
    title: 'Zero-Waste Shampoo Bars in Refillable Tins',
    tagline: 'One bar lasts as long as 2-3 liquid bottles',
    description: `Liquid shampoo is 80% water—we're literally shipping water across the world. Shampoo bars are concentrated, lightweight, and last 3x longer per ounce. These bars are made from organic oils (coconut, argan, jojoba) and natural botanical extracts—zero sulfates, zero silicones, zero plastic. The formula creates luxurious lather and leaves hair silky without buildup. Each bar lasts 40+ shampoos. Available in 8 formulations: volumizing, moisturizing, clarifying, color-safe, dandruff-control, etc. The beautiful refillable tin is durable enough to last years. When you're done with a bar, simply place your empty tin in prepaid shipping—we compost your bar and restock your tin with a fresh one. The subscription is flexible: pause anytime, change formulas whenever you want. Plastic-free packaging and shipping. Dramatically reduces bathroom waste—one person using bars for a year produces zero plastic waste from shampoo. Hair dries noticeably healthier since bars don't strip natural oils. Lathers beautifully even in hard water. Travel-friendly for backpacking and camping. Dermatologist tested. Better for oceans since bars don't contain ocean-damaging chemicals.`,
    category: 'Sustainability',
    targetPrice: 15,
    lobbyCount: 13,
    lobbyIntensities: ['PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY', 'NEAT_IDEA', 'TAKE_MY_MONEY', 'PROBABLY_BUY'],
  },
  {
    title: 'Portable Air Quality Monitor with Health Alerts',
    tagline: 'Breathe better. Know what you\'re breathing.',
    description: `Air quality invisibly affects health—poor air increases asthma attacks, sleep disruption, and long-term lung damage. This pocket-sized monitor measures PM2.5, PM10, NO₂, and VOCs in real-time with medical-grade sensors. The display shows air quality scores (excellent/good/moderate/poor/hazardous) with helpful context—like "worse than driving behind a bus." App integrations alert you when air quality drops below your health threshold. Perfect for asthmatics and people with respiratory conditions. Use it to compare air quality at home, office, and gym—make informed environment choices. The battery lasts 12 hours on a charge. Connects via Bluetooth to see historical trends and location maps. Small enough to carry everywhere. Helps you avoid outdoor activities during smog days and find cleaner locations. Reveals surprising air quality variations—restaurants, parks, even neighborhoods differ dramatically. Data is completely private—stored locally, never uploaded. The sensor recalibrates quarterly through the app. FDA cleared for accuracy. Recommended by pulmonologists and environmental health experts.`,
    category: 'Health',
    targetPrice: 120,
    lobbyCount: 8,
    lobbyIntensities: ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY'],
  },
  {
    title: 'Magnetic Tool Organiser for Workshop Walls',
    tagline: 'Tools visible, organized, instantly accessible',
    description: `Workshop clutter drives every maker crazy—tools scattered across benches, lost in drawers, impossible to find when you need them. This system uses powerful rare-earth magnets embedded in sleek aluminum rails that mount horizontally or vertically. Tools stick directly to the rail—no tools, no brackets, no complicated mounting. The grip is strong enough for heavy power tools but simple to remove and reposition. The rails are finished in matte black or brushed aluminum, looking professional in finished workshops. Mount them at eye level for instant tool identification. The modular system starts with a single 24" rail and expands to cover entire walls. Lighting can be integrated—LED strips attach magnetically and illuminate your tool collection. Works with any ferrous metal tool—wrenches, screwdrivers, drills, saws, chisels. Heavy-duty 15-pound capacity per rail. The magnetic surface never wears out. Reduces tool-finding time by 80%. Perfect for garages, workshops, job sites, and craft studios. Wall-mounted storage dramatically increases usable bench space. Looks impressive and professional. Precision-engineered for durability.`,
    category: 'Home',
    targetPrice: 85,
    lobbyCount: 9,
    lobbyIntensities: ['PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY', 'NEAT_IDEA'],
  },
]

// Brands campaigns can target, keyed loosely by category
const BRAND_SEEDS: Array<{ name: string; website: string; categories: string[] }> = [
  { name: 'Dyson', website: 'https://www.dyson.co.uk', categories: ['Home', 'Tech', 'Beauty'] },
  { name: 'IKEA', website: 'https://www.ikea.com', categories: ['Home', 'Sustainability'] },
  { name: 'Sony', website: 'https://www.sony.co.uk', categories: ['Tech', 'Audio', 'Gaming'] },
  { name: 'Patagonia', website: 'https://www.patagonia.com', categories: ['Apparel', 'Sustainability'] },
  { name: 'Fitbit', website: 'https://www.fitbit.com', categories: ['Health', 'Wearables'] },
  { name: 'LEGO', website: 'https://www.lego.com', categories: ['Gaming', 'Other'] },
  { name: 'Samsung', website: 'https://www.samsung.com', categories: ['Tech', 'Home'] },
  { name: 'Nike', website: 'https://www.nike.com', categories: ['Apparel', 'Sports', 'Health'] },
]

export async function seedCampaigns(creatorUsers: Array<{ id: string; handle: string }>) {
  console.log('Seeding campaigns...')
  const intensityOptions: LobbyIntensity[] = ['NEAT_IDEA', 'PROBABLY_BUY', 'TAKE_MY_MONEY']

  // Create brands first so campaigns can target them
  const brands = []
  for (const b of BRAND_SEEDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(b.name) },
      update: {},
      create: {
        name: b.name,
        slug: slugify(b.name),
        website: b.website,
        status: 'UNCLAIMED',
      },
    })
    brands.push({ ...brand, categories: b.categories })
  }
  console.log(`Seeded ${brands.length} brands`)

  let campaignIndex = 0
  for (const campaign of campaigns) {
    const creator = creatorUsers[Math.floor(Math.random() * creatorUsers.length)]
    const slug = slugify(campaign.title)

    // Target a category-appropriate brand for ~3 in 4 campaigns;
    // leave the rest open to alternatives
    const matching = brands.filter((b) => b.categories.includes(campaign.category))
    const pool = matching.length > 0 ? matching : brands
    const targetBrand = campaignIndex % 4 === 3 ? null : pool[campaignIndex % pool.length]
    campaignIndex++

    // Idempotency: campaigns are created (not upserted) because they carry
    // dependent rows (lobbies, comments) — if this slug already exists from
    // a previous seed run, leave it and its data alone.
    const existingCampaign = await prisma.campaign.findUnique({
      where: { slug },
      select: { id: true },
    })
    if (existingCampaign) {
      console.log(`Campaign already seeded, skipping: ${campaign.title}`)
      continue
    }

    // Create campaign
    const createdCampaign = await prisma.campaign.create({
      data: {
        creatorUserId: creator.id,
        title: campaign.title,
        slug: slug,
        description: campaign.description,
        category: campaign.category,
        status: 'LIVE',
        path: 'LOBBYING',
        suggestedPrice: campaign.targetPrice,
        currency: 'GBP',
        targetedBrandId: targetBrand?.id ?? null,
        openToAlternatives: !targetBrand,
      },
    })

    console.log(`Created campaign: ${campaign.title}`)

    // Add lobbies with varied intensities — one distinct user per lobby
    // (Lobby has a unique constraint on campaign_id + user_id)
    const otherUsers = await prisma.user.findMany({
      where: { id: { not: creator.id } },
    })
    const lobbies = await prisma.lobby.createMany({
      data: campaign.lobbyIntensities
        .slice(0, otherUsers.length)
        .map((intensity, idx) => ({
          campaignId: createdCampaign.id,
          userId: otherUsers[idx].id,
          intensity: intensity,
          status: 'VERIFIED' as const,
        })),
      skipDuplicates: true,
    })

    console.log(`Added ${lobbies.count} lobbies to ${campaign.title}`)

    // Add some comments
    const commentCount = Math.floor(Math.random() * 4) + 1
    for (let i = 0; i < commentCount; i++) {
      const randomUser = await prisma.user.findFirst({
        where: {
          id: {
            not: creator.id,
          },
        },
        skip: Math.floor(Math.random() * 5),
      })

      if (randomUser) {
        const comments = [
          'This is exactly what I\'ve been waiting for!',
          'Already pre-ordered!',
          'Want this so badly',
          'Amazing product idea',
          'The market definitely needs this',
          'Perfect solution',
          'Game-changer material',
          'Been asking for this for years',
          'This solves a real problem',
          'Backed! Can\'t wait for delivery',
        ]

        await prisma.comment.create({
          data: {
            campaignId: createdCampaign.id,
            userId: randomUser.id,
            content: comments[Math.floor(Math.random() * comments.length)],
            status: 'VISIBLE',
          },
        })
      }
    }

    // Add a share
    await prisma.share.create({
      data: {
        campaignId: createdCampaign.id,
        userId: creator.id,
        platform: 'TWITTER',
        clickCount: Math.floor(Math.random() * 100),
      },
    })
  }

  console.log('Campaign seeding complete!')
}
