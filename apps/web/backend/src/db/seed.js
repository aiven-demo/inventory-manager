const { Pool } = require("pg");

const dbUrl = process.env.DATABASE_URL || "";
const useSSL = dbUrl.includes("sslmode=require");
const pool = new Pool({
  connectionString: dbUrl.replace(/[\?&]sslmode=require/, ""),
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query(`DROP TABLE IF EXISTS items CASCADE`);

    await client.query(`
      CREATE TABLE items (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        components TEXT[] NOT NULL,
        procedures TEXT[] NOT NULL,
        lead_time INTEGER NOT NULL,
        priority VARCHAR(50) NOT NULL,
        stock_qty INTEGER DEFAULT 4,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        pinned_at TIMESTAMP
      );
    `);
    console.log("Tables created successfully");
  } finally {
    client.release();
  }
};

const seedData = async () => {
  const client = await pool.connect();
  try {
    const items = [
      {
        title: "Industrial Servo Motor SM-400",
        description:
          "High-torque brushless servo motor for automated assembly lines and CNC machinery",
        components: [
          "4500g Brushless DC motor core",
          "600g High-precision ball bearing set",
          "150g Optical encoder 4096 PPR",
          "2200g Aluminum heat sink housing",
          "85g 24V power connector assembly",
          "120g M6 mounting bolt kit",
        ],
        procedures: [
          "Store in dry environment below 40°C with humidity under 60%",
          "Handle with anti-static wrist strap during unpacking",
          "Verify shaft alignment before installation using dial indicator",
          "Apply thermal paste to heat sink interface surface",
          "Torque mounting bolts to 12 Nm in star pattern",
          "Run calibration sequence after installation per spec SM-400-CAL",
        ],
        lead_time: 14,
        priority: "Medium",
        stock_qty: 45,
        image_url:
          "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
      },
      {
        title: "10GbE Managed Network Switch",
        description:
          "Enterprise-grade 48-port managed switch with 10GbE SFP+ uplinks for data center deployment",
        components: [
          "8500g Switch chassis unit with backplane",
          "450g 10GbE SFP+ uplink module",
          "200g RJ45 Gigabit port assembly",
          "1800g Redundant power supply 350W",
          "50g Management console cable",
          "320g Rack mount bracket kit",
        ],
        procedures: [
          "Unpack and inspect for shipping damage within 48 hours of receipt",
          "Install rack mount brackets on both sides using provided hardware",
          "Connect redundant power supplies to separate circuits",
          "Assign management IP via console port using included cable",
          "Update firmware to latest stable version before deployment",
          "Configure VLANs and port security policies per network architecture doc",
        ],
        lead_time: 21,
        priority: "High",
        stock_qty: 12,
        image_url:
          "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
      },
      {
        title: "Hydraulic Pump Assembly HP-200",
        description:
          "Variable displacement axial piston pump rated at 200 bar for heavy-duty hydraulic systems",
        components: [
          "6200g Axial piston pump body",
          "1800g Ceramic-coated piston set",
          "950g Swashplate mechanism",
          "180g Shaft seal kit",
          "340g High-pressure hose fitting pair",
          "420g Pressure relief valve 350 bar",
          "280g Vibration dampening mount set",
        ],
        procedures: [
          "Store with all ports sealed against contamination at all times",
          "Fill pump housing with hydraulic fluid before first start",
          "Verify rotation direction matches system requirements",
          "Install pressure gauge on outlet port for monitoring",
          "Bleed air from system at low pressure before full operation",
          "Run at 50% load for first 2 hours during break-in period",
        ],
        lead_time: 30,
        priority: "High",
        stock_qty: 8,
        image_url:
          "https://images.unsplash.com/photo-1504222490345-c075b6008014?w=400",
      },
      {
        title: "LED Monitor Panel 27\" UHD",
        description:
          "Professional-grade 27-inch 4K IPS display for workstation and control room use",
        components: [
          "3200g 27-inch IPS LCD panel assembly",
          "800g LED backlight module",
          "250g Display driver board",
          "450g VESA mount bracket",
          "120g DisplayPort 1.4 cable",
          "380g USB-C hub module",
          "340g Power adapter 65W",
        ],
        procedures: [
          "Remove protective film from screen surface before use",
          "Attach VESA mount or desktop stand per installation guide",
          "Connect DisplayPort or USB-C to workstation output",
          "Calibrate color profile using built-in OSD menu",
          "Enable blue light filter for operator comfort on extended shifts",
          "Set auto-brightness based on ambient light sensor",
        ],
        lead_time: 7,
        priority: "Low",
        stock_qty: 156,
        image_url:
          "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400",
      },
      {
        title: "Copper Wire Spool AWG-10 500m",
        description:
          "Industrial-grade solid copper conductor wire for power distribution and panel wiring",
        components: [
          "45000g Solid copper conductor AWG-10",
          "5200g PVC insulation jacket rated 600V",
          "3800g Steel wire spool",
          "15g Wire specification tag",
        ],
        procedures: [
          "Store indoors in dry ventilated area away from corrosive agents",
          "Do not exceed minimum bend radius of 5x cable diameter",
          "Cut with rated cable cutters only to prevent conductor damage",
          "Strip insulation 15mm for terminal connections",
          "Apply anti-oxidant paste on exposed copper before termination",
          "Verify continuity with multimeter after each termination",
        ],
        lead_time: 10,
        priority: "Medium",
        stock_qty: 340,
        image_url:
          "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400",
      },
      {
        title: "Steel Sheet 4x8ft 16ga",
        description:
          "Cold-rolled carbon steel sheet for fabrication, enclosures, and structural components",
        components: [
          "52000g Cold-rolled steel sheet",
          "200g Protective oil coating",
          "150g Interleaving paper",
        ],
        procedures: [
          "Store flat on level surface with interleaving paper between sheets",
          "Handle with gloves to prevent surface contamination and corrosion",
          "Inspect for surface defects and dimensional accuracy before use",
          "Cut using shear, laser, or plasma per job specification",
          "Deburr all cut edges before further processing",
          "Apply primer within 24 hours of cutting to prevent rust",
        ],
        lead_time: 5,
        priority: "Medium",
        stock_qty: 220,
        image_url:
          "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400",
      },
      {
        title: "Safety Helmet Class E",
        description:
          "Type I Class E hard hat with 4-point ratchet suspension rated for electrical work",
        components: [
          "380g High-density polyethylene shell",
          "120g 4-point ratchet suspension system",
          "45g Replaceable sweatband",
          "30g Chin strap with quick-release buckle",
          "15g Reflective sticker set",
        ],
        procedures: [
          "Inspect shell for cracks or UV degradation before each use",
          "Replace suspension system every 12 months per OSHA guidelines",
          "Do not drill holes or modify shell structure",
          "Store away from direct sunlight when not in use",
          "Clean with mild soap and water only",
        ],
        lead_time: 3,
        priority: "Low",
        stock_qty: 500,
        image_url:
          "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400",
      },
      {
        title: "Server Rack Unit 42U",
        description:
          "Standard 42U floor-standing server cabinet with cable management and cooling",
        components: [
          "45000g Welded steel frame structure",
          "8200g Front and rear locking doors with glass panel",
          "3500g Adjustable 19-inch mounting rail set",
          "2800g Cable management panel kit",
          "1500g Top-mount fan tray assembly",
          "4200g Caster and leveling foot set",
        ],
        procedures: [
          "Assemble on level floor surface with minimum 1m clearance on all sides",
          "Secure to floor using anchor bolt kit for seismic compliance",
          "Install mounting rails at correct depth for equipment",
          "Route power cables through dedicated cable management channels",
          "Connect fan tray to thermostat controller",
          "Verify door locks function before loading equipment",
        ],
        lead_time: 28,
        priority: "High",
        stock_qty: 6,
        image_url:
          "https://images.unsplash.com/photo-1750711731797-25c3f2551ff8?w=400",
      },
      {
        title: "Pneumatic Cylinder DN-50",
        description:
          "Double-acting pneumatic cylinder with 50mm bore and magnetic piston for position sensing",
        components: [
          "2800g Aluminum cylinder barrel",
          "650g Hardened steel piston rod",
          "180g Magnetic piston assembly",
          "120g Rod seal and wiper kit",
          "90g Cushioning adjustment screw set",
          "240g Pivot mount bracket",
        ],
        procedures: [
          "Verify air supply is clean and dry before connection",
          "Install flow control valves on both ports for speed adjustment",
          "Set cushioning to prevent end-of-stroke impact damage",
          "Check magnetic sensor alignment after mounting",
          "Lubricate rod with pneumatic-grade oil monthly",
          "Replace seal kit every 2 million cycles or annually",
        ],
        lead_time: 12,
        priority: "Medium",
        stock_qty: 67,
        image_url:
          "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400",
      },
      {
        title: "Fiber Optic Patch Cable 100m",
        description:
          "Single-mode OS2 fiber optic cable with LC duplex connectors for backbone and campus links",
        components: [
          "2500g Single-mode fiber core assembly",
          "3800g Aramid strength member",
          "1200g LSZH outer jacket",
          "45g LC duplex connector pair",
          "30g Protective dust cap set",
        ],
        procedures: [
          "Store in original packaging coiled at minimum bend radius",
          "Inspect connector end-faces with fiber scope before each connection",
          "Clean connectors with lint-free wipes and IPA solution",
          "Route through fiber-rated cable tray only",
          "Do not exceed maximum pulling tension of 100N",
          "Test insertion loss with OTDR after installation",
        ],
        lead_time: 5,
        priority: "Low",
        stock_qty: 89,
        image_url:
          "https://images.unsplash.com/photo-1594915440248-1e419eba6611?w=400",
      },
      {
        title: "Ball Bearing SKF 6205-2RS",
        description:
          "Deep groove ball bearing with double rubber seal for general purpose industrial applications",
        components: [
          "130g Chrome steel inner and outer race",
          "25g Steel ball complement",
          "8g Polyamide cage retainer",
          "5g Nitrile rubber seal pair",
          "2g Lithium-complex grease fill",
        ],
        procedures: [
          "Store in original sealed packaging until installation",
          "Handle with clean lint-free gloves to prevent contamination",
          "Heat to 80°C for interference fit installation on shaft",
          "Apply even pressure to inner race only when pressing onto shaft",
          "Verify free rotation after installation",
          "Re-grease at intervals specified in equipment maintenance schedule",
        ],
        lead_time: 4,
        priority: "Low",
        stock_qty: 1200,
        image_url:
          "https://images.unsplash.com/photo-1769971361788-ceda92ad2263?w=400",
      },
      {
        title: "Industrial PLC Module S7-1500",
        description:
          "Siemens-compatible programmable logic controller CPU module for factory automation",
        components: [
          "420g CPU processor module",
          "180g Memory card 256MB",
          "95g Digital I/O expansion board",
          "60g Communication interface module",
          "35g DIN rail mounting clip set",
          "25g Front connector kit",
        ],
        procedures: [
          "Mount on 35mm DIN rail in control cabinet with adequate ventilation",
          "Connect 24V DC power supply to designated terminals",
          "Insert pre-programmed memory card before first power-on",
          "Configure IP address via PROFINET interface",
          "Download safety program and verify checksum",
          "Perform I/O loop test before connecting to field devices",
        ],
        lead_time: 25,
        priority: "High",
        stock_qty: 15,
        image_url:
          "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
      },
      {
        title: "Aluminum Extrusion T-Slot 2040",
        description:
          "Structural aluminum T-slot extrusion profile 20x40mm for machine frames and enclosures",
        components: [
          "2700g 6063-T5 aluminum extrusion 2m length",
          "85g T-nut and bolt hardware kit",
          "40g End cap set",
          "25g Corner bracket pair",
        ],
        procedures: [
          "Cut to length using aluminum-rated chop saw with carbide blade",
          "Deburr cut ends with file or deburring tool",
          "Insert T-nuts before assembling frame structure",
          "Torque corner brackets to 8 Nm for structural joints",
          "Verify squareness with machinist square during assembly",
          "Apply anodized finish touch-up pen to cut surfaces",
        ],
        lead_time: 8,
        priority: "Medium",
        stock_qty: 430,
        image_url:
          "https://images.unsplash.com/photo-1769147339214-076740872485?w=400",
      },
      {
        title: "Ergonomic Office Chair Pro",
        description:
          "Adjustable ergonomic task chair with lumbar support and breathable mesh back",
        components: [
          "5500g Steel and aluminum base frame",
          "2800g High-density foam seat cushion",
          "1500g Breathable mesh back panel",
          "800g Gas lift cylinder",
          "600g Adjustable armrest pair",
          "350g Lumbar support mechanism",
          "250g 65mm dual-wheel caster set",
        ],
        procedures: [
          "Unpack all components and verify against parts list",
          "Attach gas lift to base and install casters",
          "Mount seat plate to gas lift and attach backrest",
          "Install armrests and adjust to operator height",
          "Set lumbar depth to provide lower back support",
          "Adjust seat height so feet rest flat on floor",
        ],
        lead_time: 14,
        priority: "Low",
        stock_qty: 75,
        image_url:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
      },
      {
        title: "UPS Battery Backup 3kVA",
        description:
          "Online double-conversion uninterruptible power supply for critical infrastructure protection",
        components: [
          "18000g Sealed lead-acid battery pack",
          "4500g Double-conversion inverter module",
          "2200g Automatic transfer switch",
          "800g LCD status display panel",
          "350g Network management card",
          "600g Input/output terminal block",
        ],
        procedures: [
          "Install in temperature-controlled room below 25°C for optimal battery life",
          "Connect input power to dedicated 30A circuit breaker",
          "Verify input voltage and frequency before energizing",
          "Charge batteries for 8 hours before connecting critical load",
          "Configure network management card for SNMP monitoring",
          "Test transfer to battery mode monthly under partial load",
        ],
        lead_time: 18,
        priority: "High",
        stock_qty: 22,
        image_url:
          "https://images.unsplash.com/photo-1770910195585-825a1181a704?w=400",
      },
      {
        title: "Welding Rod E7018 5kg Pack",
        description:
          "Low-hydrogen shielded metal arc welding electrode for structural steel fabrication",
        components: [
          "4800g Steel core wire with flux coating",
          "150g Moisture-resistant packaging",
          "50g Batch test certificate",
        ],
        procedures: [
          "Store in heated rod oven at 120°C to prevent moisture absorption",
          "Remove only quantity needed for immediate use",
          "Preheat base metal per WPS if thickness exceeds 25mm",
          "Maintain 15-20 degree drag angle during welding",
          "Clean slag between passes with chipping hammer and wire brush",
          "Return unused rods to oven within 4 hours of removal",
        ],
        lead_time: 3,
        priority: "Low",
        stock_qty: 2500,
        image_url:
          "https://images.unsplash.com/photo-1738162837408-5fbf53f0b97a?w=400",
      },
      {
        title: "Thermal Imaging Camera TIC-640",
        description:
          "640x480 resolution handheld thermal camera for predictive maintenance and electrical inspection",
        components: [
          "320g Uncooled microbolometer sensor",
          "280g Germanium lens assembly",
          "450g Magnesium alloy housing",
          "180g Li-ion battery pack",
          "150g 4-inch touchscreen display",
          "85g Wireless communication module",
          "40g Micro-SD storage card 64GB",
        ],
        procedures: [
          "Charge battery fully before first use (approximately 3 hours)",
          "Allow 10-minute warm-up period for sensor stabilization",
          "Set emissivity value for target material before measurement",
          "Maintain perpendicular angle to target surface for accurate readings",
          "Capture reference image in visible spectrum alongside thermal",
          "Download and analyze images using companion software suite",
        ],
        lead_time: 35,
        priority: "High",
        stock_qty: 4,
        image_url:
          "https://images.unsplash.com/photo-1513828418004-7aa1c7e5c824?w=400",
      },
      {
        title: "Conveyor Belt Section 2m",
        description:
          "Heavy-duty PVC conveyor belt segment for material handling and production line transport",
        components: [
          "8500g PVC belt with polyester reinforcement",
          "4200g Galvanized steel frame section",
          "1800g Drive roller assembly",
          "1200g Idler roller set",
          "450g Belt tensioning mechanism",
          "320g Side guide rail pair",
        ],
        procedures: [
          "Level frame section using adjustable feet before belt installation",
          "Align drive and idler rollers to within 0.5mm tolerance",
          "Install belt with correct tension per manufacturer spec",
          "Verify tracking by running belt unloaded for 15 minutes",
          "Install side guide rails with 2mm clearance from belt edge",
          "Lubricate drive roller bearings with food-grade grease if applicable",
        ],
        lead_time: 15,
        priority: "Medium",
        stock_qty: 28,
        image_url:
          "https://images.unsplash.com/photo-1764745021344-317b80f09e40?w=400",
      },
      {
        title: "Stainless Steel Valve DN-25",
        description:
          "316L stainless steel ball valve for process piping and chemical handling applications",
        components: [
          "1800g 316L stainless steel body",
          "350g PTFE seat and seal set",
          "280g Stainless steel ball element",
          "120g Stem packing assembly",
          "85g Lever handle with locking plate",
          "45g Gasket kit (PTFE and graphite)",
        ],
        procedures: [
          "Flush pipeline before installation to remove debris",
          "Install with flow arrow matching process direction",
          "Torque flange bolts in cross pattern per ASME PCC-1",
          "Cycle valve full open to full close to verify operation",
          "Perform hydrostatic test at 1.5x working pressure",
          "Tag valve with unique ID and record in maintenance database",
        ],
        lead_time: 9,
        priority: "Medium",
        stock_qty: 95,
        image_url:
          "https://images.unsplash.com/photo-1773517458766-82ddcbeef548?w=400",
      },
      {
        title: "Forklift Battery 48V 700Ah",
        description:
          "Industrial traction battery for electric counterbalance forklifts and warehouse vehicles",
        components: [
          "85000g Lead-acid cell assembly 24-cell",
          "12000g Steel battery tray",
          "3500g Intercell connector harness",
          "800g Battery watering system",
          "450g Terminal connector and cable set",
        ],
        procedures: [
          "Transport and install using rated overhead crane or battery handler",
          "Verify polarity before connecting to vehicle",
          "Perform equalization charge cycle before first use",
          "Check electrolyte levels weekly and top up with distilled water",
          "Clean terminal connections monthly to prevent voltage drop",
          "Record specific gravity readings quarterly for capacity trending",
        ],
        lead_time: 21,
        priority: "High",
        stock_qty: 10,
        image_url:
          "https://images.unsplash.com/photo-1740914994657-f1cdffdc418e?w=400",
      },
      {
        title: "Anti-Static Workstation Mat",
        description:
          "Two-layer ESD-safe workstation mat with grounding snap for electronics assembly areas",
        components: [
          "1200g Conductive rubber top layer",
          "800g Dissipative foam base layer",
          "35g Grounding snap and cord assembly",
          "15g Surface resistance test certificate",
        ],
        procedures: [
          "Clean work surface before mat placement",
          "Connect grounding snap to verified earth ground point",
          "Test surface resistance with ESD meter before each shift",
          "Clean mat surface with ESD-approved cleaner only",
          "Replace if surface resistance exceeds 1x10^9 ohms",
        ],
        lead_time: 5,
        priority: "Low",
        stock_qty: 200,
        image_url:
          "https://images.unsplash.com/photo-1651340527836-263c5072968e?w=400",
      },
      {
        title: "Pressure Gauge 0-100 PSI",
        description:
          "Bourdon tube analog pressure gauge with glycerin fill for vibration dampening",
        components: [
          "280g Stainless steel case and bezel",
          "45g Phosphor bronze Bourdon tube",
          "30g Movement and pointer assembly",
          "120g Glycerin fill",
          "25g 1/4 NPT brass bottom connection",
        ],
        procedures: [
          "Install at eye level in accessible location for easy reading",
          "Use thread sealant tape on NPT connection (2-3 wraps)",
          "Install snubber or pulsation dampener if system has pressure spikes",
          "Zero-check gauge with system depressurized before commissioning",
          "Calibrate annually against certified reference gauge",
        ],
        lead_time: 4,
        priority: "Low",
        stock_qty: 150,
        image_url:
          "https://images.unsplash.com/photo-1761758674188-2b8e4c89c5e2?w=400",
      },
      {
        title: "Industrial Robot Arm Joint J3",
        description:
          "High-precision articulated joint module for 6-axis industrial robot arm assembly",
        components: [
          "5800g Harmonic drive gear reducer",
          "2400g Brushless servo motor with encoder",
          "1800g Aluminum alloy joint housing",
          "350g Absolute position encoder",
          "280g Internal cable harness assembly",
          "180g Torque sensor module",
          "120g Thermal management heat pipe",
        ],
        procedures: [
          "Handle in clean room or controlled environment only",
          "Verify gear reducer backlash is within 1 arc-minute specification",
          "Pre-load bearing per assembly torque specification",
          "Route internal cables through designated channels without kinking",
          "Calibrate absolute encoder using manufacturer alignment tool",
          "Run 24-hour burn-in test at 80% rated load before deployment",
        ],
        lead_time: 45,
        priority: "High",
        stock_qty: 3,
        image_url:
          "https://images.unsplash.com/photo-1713244433542-4c6205d09d97?w=400",
      },
      {
        title: "Cable Tray 3m Section",
        description:
          "Hot-dip galvanized ladder cable tray for overhead power and data cable routing",
        components: [
          "6500g Galvanized steel side rails",
          "2800g Cross rung set",
          "450g Splice plate connector pair",
          "180g Ground bonding jumper",
          "120g Bolt and nut hardware kit",
        ],
        procedures: [
          "Install support brackets at maximum 1.5m intervals",
          "Level each section using torpedo level during installation",
          "Connect sections using splice plates with minimum 4 bolts",
          "Install ground bonding jumper across each splice point",
          "Maintain cable fill ratio below 50% for adequate ventilation",
          "Label tray sections with circuit identification per NEC Article 392",
        ],
        lead_time: 6,
        priority: "Low",
        stock_qty: 180,
        image_url:
          "https://images.unsplash.com/photo-1756705406506-50500a12463c?w=400",
      },
      {
        title: "Variable Frequency Drive 5HP",
        description:
          "Three-phase variable frequency drive for motor speed control in HVAC and pump applications",
        components: [
          "3200g Power inverter module",
          "1500g Rectifier and DC bus capacitor bank",
          "800g Microprocessor controller board",
          "450g Heat sink with forced-air fan",
          "280g EMC filter module",
          "150g Operator keypad display",
          "120g Terminal block assembly",
        ],
        procedures: [
          "Mount vertically in ventilated enclosure with minimum clearances",
          "Connect three-phase input power with proper wire gauge per NEC",
          "Route motor cables separately from control and signal wiring",
          "Program motor nameplate parameters (voltage, current, RPM)",
          "Configure acceleration and deceleration ramp times for application",
          "Perform auto-tune function to optimize motor model parameters",
          "Verify fault relay wiring to building management system",
        ],
        lead_time: 16,
        priority: "Medium",
        stock_qty: 35,
        image_url:
          "https://images.unsplash.com/photo-1772149394719-d0f08b0805b6?w=400",
      },
    ];

    for (const item of items) {
      await client.query(
        `INSERT INTO items (title, description, components, procedures, lead_time, priority, stock_qty, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          item.title,
          item.description,
          item.components,
          item.procedures,
          item.lead_time,
          item.priority,
          item.stock_qty,
          item.image_url,
        ]
      );
    }

    console.log("Seeded 25 inventory items successfully");
  } finally {
    client.release();
  }
};

const main = async () => {
  try {
    await createTables();
    await seedData();
    console.log("Database setup complete!");
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

main();
