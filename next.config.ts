import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // ==========================================
      // 常见分类路径变体重定向
      // 基于 Google Search Console 404 报告添加
      // ==========================================

      // Adhesives, Sealants and Tape - 常见变体
      { source: '/category/adhesives-tapes', destination: '/category/adhesives-sealants-and-tape', permanent: true },
      { source: '/category/adhesives-tapes/:path*', destination: '/category/adhesives-sealants-and-tape/:path*', permanent: true },
      { source: '/category/adhesive-tape', destination: '/category/adhesives-sealants-and-tape', permanent: true },
      { source: '/category/tape', destination: '/category/adhesives-sealants-and-tape', permanent: true },

      // Cleaning and Janitorial - 常见变体
      { source: '/category/cleaning-janitorial', destination: '/category/cleaning-and-janitorial', permanent: true },
      { source: '/category/janitorial-supplies', destination: '/category/cleaning-and-janitorial', permanent: true },
      { source: '/category/cleaning-supply', destination: '/category/cleaning-and-janitorial', permanent: true },
      { source: '/category/facility-maintenance', destination: '/category/cleaning-and-janitorial', permanent: true },

      // Material Handling - 常见变体
      { source: '/category/materials-handling', destination: '/category/material-handling', permanent: true },
      { source: '/category/material-handling-equipment', destination: '/category/material-handling', permanent: true },
      { source: '/category/warehouse-equipment', destination: '/category/material-handling', permanent: true },

      // Packaging & Shipping - 常见变体
      { source: '/category/packaging-shipping-supplies', destination: '/category/packaging-shipping', permanent: true },
      { source: '/category/packaging-and-shipping', destination: '/category/packaging-shipping', permanent: true },
      { source: '/category/shipping-supplies', destination: '/category/packaging-shipping', permanent: true },

      // Pipe, Hose, Tube & Fittings - 常见变体
      { source: '/category/pipe-hose-tube', destination: '/category/pipe-hose-tube-fittings', permanent: true },
      { source: '/category/pipe-hose-fittings', destination: '/category/pipe-hose-tube-fittings', permanent: true },
      { source: '/category/hose-fittings', destination: '/category/pipe-hose-tube-fittings', permanent: true },

      // Plumbing - 常见变体
      { source: '/category/plumbing-supplies', destination: '/category/plumbing', permanent: true },
      { source: '/category/plumbing-equipment', destination: '/category/plumbing', permanent: true },

      // Power Transmission - 常见变体
      { source: '/category/power-transmission-parts', destination: '/category/power-transmission', permanent: true },
      { source: '/category/power-transmission-components', destination: '/category/power-transmission', permanent: true },

      // Safety - 常见变体
      { source: '/category/safety-equipment', destination: '/category/safety', permanent: true },
      { source: '/category/safety-supplies', destination: '/category/safety', permanent: true },
      { source: '/category/industrial-safety', destination: '/category/safety', permanent: true },
      { source: '/category/ppe', destination: '/category/safety', permanent: true },
      { source: '/category/personal-protective-equipment', destination: '/category/safety', permanent: true },

      // Tools - 常见变体
      { source: '/category/tools-equipment', destination: '/category/tools', permanent: true },
      { source: '/category/industrial-tools', destination: '/category/tools', permanent: true },
      { source: '/category/hand-tools', destination: '/category/tools', permanent: true },

      // Electrical - 常见变体
      { source: '/category/electrical-supplies', destination: '/category/electrical', permanent: true },
      { source: '/category/electrical-equipment', destination: '/category/electrical', permanent: true },

      // Lighting - 常见变体
      { source: '/category/lighting-fixtures', destination: '/category/lighting', permanent: true },
      { source: '/category/industrial-lighting', destination: '/category/lighting', permanent: true },

      // Lab Supplies - 常见变体
      { source: '/category/lab-equipment', destination: '/category/lab-supplies', permanent: true },
      { source: '/category/laboratory-supplies', destination: '/category/lab-supplies', permanent: true },
      { source: '/category/laboratory-equipment', destination: '/category/lab-supplies', permanent: true },

      // HVAC and Refrigeration - 常见变体
      { source: '/category/hvac-refrigeration', destination: '/category/hvac-and-refrigeration', permanent: true },
      { source: '/category/hvac-equipment', destination: '/category/hvac-and-refrigeration', permanent: true },
      { source: '/category/heating-ventilation-ac', destination: '/category/hvac-and-refrigeration', permanent: true },

      // Hardware - 常见变体
      { source: '/category/hardware-supplies', destination: '/category/hardware', permanent: true },
      { source: '/category/industrial-hardware', destination: '/category/hardware', permanent: true },

      // ==========================================
      // L2 分类常见变体重定向
      // ==========================================

      // Hand & Arm Protection
      { source: '/category/hand-protection', destination: '/category/hand-arm-protection', permanent: true },
      { source: '/category/gloves', destination: '/category/hand-arm-protection', permanent: true },

      // Head Protection
      { source: '/category/head-protection-equipment', destination: '/category/head-protection', permanent: true },
      { source: '/category/helmets', destination: '/category/head-protection', permanent: true },

      // Lockout Tagout
      { source: '/category/lockout-tagout-equipment', destination: '/category/lockout-tagout', permanent: true },
      { source: '/category/loto', destination: '/category/lockout-tagout', permanent: true },

      // Bearings
      { source: '/category/bearing', destination: '/category/bearings', permanent: true },
      { source: '/category/industrial-bearings', destination: '/category/bearings', permanent: true },

      // Casters & Wheels
      { source: '/category/casters', destination: '/category/casters-wheels', permanent: true },
      { source: '/category/wheels', destination: '/category/casters-wheels', permanent: true },
      { source: '/category/caster-wheels', destination: '/category/casters-wheels', permanent: true },

      // Cleaning Supplies
      { source: '/category/cleaning-products', destination: '/category/cleaning-supplies', permanent: true },
      { source: '/category/janitorial-products', destination: '/category/cleaning-supplies', permanent: true },

      // Hose, Hose Fittings & Hose Reels
      { source: '/category/hose-fittings', destination: '/category/hose-hose-fittings-hose-reels', permanent: true },
      { source: '/category/hose-reel', destination: '/category/hose-hose-fittings-hose-reels', permanent: true },
      { source: '/category/hoses', destination: '/category/hose-hose-fittings-hose-reels', permanent: true },

      // Plumbing Valves
      { source: '/category/valves', destination: '/category/plumbing-valves', permanent: true },
      { source: '/category/industrial-valves', destination: '/category/plumbing-valves', permanent: true },

      // Wire & Cable Management
      { source: '/category/cable-management', destination: '/category/wire-cable-management', permanent: true },
      { source: '/category/wire-management', destination: '/category/wire-cable-management', permanent: true },
      { source: '/category/cable-organizers', destination: '/category/wire-cable-management', permanent: true },

      // Tool Storage
      { source: '/category/tool-boxes', destination: '/category/tool-storage', permanent: true },
      { source: '/category/tool-cabinets', destination: '/category/tool-storage', permanent: true },

      // Protective Clothing
      { source: '/category/protective-clothes', destination: '/category/protective-clothing', permanent: true },
      { source: '/category/work-clothing', destination: '/category/protective-clothing', permanent: true },

      // Workwear
      { source: '/category/work-wear', destination: '/category/workwear', permanent: true },
      { source: '/category/work-clothes', destination: '/category/workwear', permanent: true },

      // Floor Mats
      { source: '/category/flooring-mats', destination: '/category/floor-mats', permanent: true },
      { source: '/category/industrial-mats', destination: '/category/floor-mats', permanent: true },

      // First Aid & Wound Care
      { source: '/category/first-aid', destination: '/category/first-aid-wound-care', permanent: true },
      { source: '/category/first-aid-supplies', destination: '/category/first-aid-wound-care', permanent: true },
      { source: '/category/wound-care', destination: '/category/first-aid-wound-care', permanent: true },

      // Fall Protection
      { source: '/category/fall-protection-equipment', destination: '/category/fall-protection', permanent: true },
      { source: '/category/safety-harnesses', destination: '/category/fall-protection', permanent: true },

      // Fire Protection
      { source: '/category/fire-safety', destination: '/category/fire-protection', permanent: true },
      { source: '/category/fire-equipment', destination: '/category/fire-protection', permanent: true },

      // Hearing Protection
      { source: '/category/hearing-protection-equipment', destination: '/category/hearing-protection', permanent: true },
      { source: '/category/ear-protection', destination: '/category/hearing-protection', permanent: true },

      // Respiratory Protection
      { source: '/category/respiratory-protection-equipment', destination: '/category/respiratory-protection', permanent: true },
      { source: '/category/respirators', destination: '/category/respiratory-protection', permanent: true },

      // Lifting, Pulling & Positioning
      { source: '/category/lifting-equipment', destination: '/category/lifting-pulling-positioning', permanent: true },
      { source: '/category/lifting-devices', destination: '/category/lifting-pulling-positioning', permanent: true },

      // Ladders, Platforms & Personnel Lifts
      { source: '/category/ladders', destination: '/category/ladders-platforms-personnel-lifts', permanent: true },
      { source: '/category/platforms', destination: '/category/ladders-platforms-personnel-lifts', permanent: true },
      { source: '/category/personnel-lifts', destination: '/category/ladders-platforms-personnel-lifts', permanent: true },

      // Dock & Loading Equipment
      { source: '/category/loading-equipment', destination: '/category/dock-loading-equipment', permanent: true },
      { source: '/category/dock-equipment', destination: '/category/dock-loading-equipment', permanent: true },

      // Protective Packaging
      { source: '/category/protection-packaging', destination: '/category/protective-packaging', permanent: true },
      { source: '/category/packaging-protection', destination: '/category/protective-packaging', permanent: true },

      // Strapping
      { source: '/category/straps', destination: '/category/strapping', permanent: true },
      { source: '/category/strapping-materials', destination: '/category/strapping', permanent: true },

      // Stretch Wrap
      { source: '/category/stretch-film', destination: '/category/stretch-wrap', permanent: true },
      { source: '/category/pallet-wrap', destination: '/category/stretch-wrap', permanent: true },

      // Packing Tape
      { source: '/category/packing-tapes', destination: '/category/packing-tape', permanent: true },
      { source: '/category/shipping-tape', destination: '/category/packing-tape', permanent: true },

      // Packing & Shipping Bags
      { source: '/category/shipping-bags', destination: '/category/packing-shipping-bags', permanent: true },
      { source: '/category/packaging-bags', destination: '/category/packing-shipping-bags', permanent: true },

      // Air Filters
      { source: '/category/filters', destination: '/category/air-filters', permanent: true },
      { source: '/category/hvac-filters', destination: '/category/air-filters', permanent: true },

      // Lab Furniture & Accessories
      { source: '/category/lab-furniture', destination: '/category/lab-furniture-accessories', permanent: true },
      { source: '/category/laboratory-furniture', destination: '/category/lab-furniture-accessories', permanent: true },

      // Lighting Fixtures & Retrofit Kits
      { source: '/category/lighting-fixtures', destination: '/category/lighting-fixtures-retrofit-kits', permanent: true },
      { source: '/category/retrofit-kits', destination: '/category/lighting-fixtures-retrofit-kits', permanent: true },

      // Outdoor Lighting
      { source: '/category/outdoor-lights', destination: '/category/outdoor-lighting', permanent: true },
      { source: '/category/exterior-lighting', destination: '/category/outdoor-lighting', permanent: true },

      // Signs & Facility Identification Products
      { source: '/category/signs', destination: '/category/signs-facility-identification-products', permanent: true },
      { source: '/category/facility-signs', destination: '/category/signs-facility-identification-products', permanent: true },
      { source: '/category/safety-signs', destination: '/category/signs-facility-identification-products', permanent: true },

      // Adhesives & Glues
      { source: '/category/adhesive', destination: '/category/adhesives-glues', permanent: true },
      { source: '/category/glue', destination: '/category/adhesives-glues', permanent: true },
      { source: '/category/glues', destination: '/category/adhesives-glues', permanent: true },

      // Caulks, Sealants & Gasket Makers
      { source: '/category/caulks', destination: '/category/caulks-sealants-gasket-makers', permanent: true },
      { source: '/category/sealants', destination: '/category/caulks-sealants-gasket-makers', permanent: true },
      { source: '/category/gasket-makers', destination: '/category/caulks-sealants-gasket-makers', permanent: true },

      // Adhesive & Sealant Surface Preparation
      { source: '/category/surface-preparation', destination: '/category/adhesive-sealant-surface-preparation', permanent: true },
      { source: '/category/adhesive-preparation', destination: '/category/adhesive-sealant-surface-preparation', permanent: true },

      // Footwear & Footwear Accessories
      { source: '/category/safety-footwear', destination: '/category/footwear-footwear-accessories', permanent: true },
      { source: '/category/safety-shoes', destination: '/category/footwear-footwear-accessories', permanent: true },
      { source: '/category/work-boots', destination: '/category/footwear-footwear-accessories', permanent: true },

      // Flooring Hardware
      { source: '/category/flooring', destination: '/category/flooring-hardware', permanent: true },
      { source: '/category/floor-hardware', destination: '/category/flooring-hardware', permanent: true },

      // ==========================================
      // L3 分类常见变体重定向
      // ==========================================

      // Safety Gloves
      { source: '/category/gloves', destination: '/category/safety-gloves', permanent: true },
      { source: '/category/work-gloves', destination: '/category/safety-gloves', permanent: true },
      { source: '/category/protective-gloves', destination: '/category/safety-gloves', permanent: true },
      { source: '/category/industrial-gloves', destination: '/category/safety-gloves', permanent: true },

      // Bump Caps
      { source: '/category/bump-cap', destination: '/category/bump-caps', permanent: true },
      { source: '/category/safety-caps', destination: '/category/bump-caps', permanent: true },

      // Earmuffs
      { source: '/category/ear-muffs', destination: '/category/earmuffs', permanent: true },
      { source: '/category/hearing-muffs', destination: '/category/earmuffs', permanent: true },

      // Plain Bearings
      { source: '/category/plain-bearing', destination: '/category/plain-bearings', permanent: true },
      { source: '/category/sleeve-bearings', destination: '/category/plain-bearings', permanent: true },
      { source: '/category/bushings', destination: '/category/plain-bearings', permanent: true },

      // Solenoid Valves
      { source: '/category/solenoid-valve', destination: '/category/solenoid-valves', permanent: true },
      { source: '/category/electric-valves', destination: '/category/solenoid-valves', permanent: true },

      // Hose Reels
      { source: '/category/hose-reel', destination: '/category/hose-reels', permanent: true },
      { source: '/category/air-hose-reels', destination: '/category/hose-reels', permanent: true },
      { source: '/category/water-hose-reels', destination: '/category/hose-reels', permanent: true },

      // Surface Protection Tape
      { source: '/category/protection-tape', destination: '/category/surface-protection-tape', permanent: true },
      { source: '/category/masking-tape', destination: '/category/surface-protection-tape', permanent: true },

      // Tool Organizers
      { source: '/category/tool-organizer', destination: '/category/tool-organizers', permanent: true },
      { source: '/category/tool-box-organizers', destination: '/category/tool-organizers', permanent: true },

      // Instant Foam
      { source: '/category/foam-packaging', destination: '/category/instant-foam', permanent: true },
      { source: '/category/packaging-foam', destination: '/category/instant-foam', permanent: true },

      // Welding Protective Clothing
      { source: '/category/welding-clothing', destination: '/category/welding-protective-clothing', permanent: true },
      { source: '/category/welding-apparel', destination: '/category/welding-protective-clothing', permanent: true },

      // Rainwear
      { source: '/category/rain-gear', destination: '/category/rainwear', permanent: true },
      { source: '/category/rain-coats', destination: '/category/rainwear', permanent: true },
      { source: '/category/rain-jackets', destination: '/category/rainwear', permanent: true },

      // Floor Protection Mats
      { source: '/category/floor-mats-protection', destination: '/category/floor-protection-mats', permanent: true },
      { source: '/category/industrial-floor-mats', destination: '/category/floor-protection-mats', permanent: true },

      // Entrance Mats
      { source: '/category/entrance-mat', destination: '/category/entrance-mats', permanent: true },
      { source: '/category/door-mats', destination: '/category/entrance-mats', permanent: true },
      { source: '/category/entry-mats', destination: '/category/entrance-mats', permanent: true },

      // Track Wheels
      { source: '/category/track-wheel', destination: '/category/track-wheels', permanent: true },
      { source: '/category/crane-wheels', destination: '/category/track-wheels', permanent: true },

      // Lifting Slings
      { source: '/category/lifting-sling', destination: '/category/lifting-slings', permanent: true },
      { source: '/category/cargo-slings', destination: '/category/lifting-slings', permanent: true },
      { source: '/category/webbing-slings', destination: '/category/lifting-slings', permanent: true },

      // Lifting Magnets
      { source: '/category/lifting-magnet', destination: '/category/lifting-magnets', permanent: true },
      { source: '/category/magnetic-lifters', destination: '/category/lifting-magnets', permanent: true },

      // Step Stools
      { source: '/category/step-stool', destination: '/category/step-stools', permanent: true },
      { source: '/category/step-ladders', destination: '/category/step-stools', permanent: true },

      // Work Platforms
      { source: '/category/work-platform', destination: '/category/work-platforms', permanent: true },
      { source: '/category/mobile-platforms', destination: '/category/work-platforms', permanent: true },

      // Dock Bumpers
      { source: '/category/dock-bumper', destination: '/category/dock-bumpers', permanent: true },
      { source: '/category/loading-dock-bumpers', destination: '/category/dock-bumpers', permanent: true },

      // Stem Casters
      { source: '/category/stem-caster', destination: '/category/stem-casters', permanent: true },
      { source: '/category/threaded-stem-casters', destination: '/category/stem-casters', permanent: true },

      // Stamping Tools
      { source: '/category/stamping-tool', destination: '/category/stamping-tools', permanent: true },
      { source: '/category/marking-tools', destination: '/category/stamping-tools', permanent: true },

      // Medicine Vending Machines
      { source: '/category/medicine-dispensers', destination: '/category/medicine-vending-machines', permanent: true },
      { source: '/category/medical-vending-machines', destination: '/category/medicine-vending-machines', permanent: true },

      // Electrical Lockout Devices
      { source: '/category/electrical-lockout', destination: '/category/electrical-lockout-devices', permanent: true },
      { source: '/category/circuit-breaker-lockouts', destination: '/category/electrical-lockout-devices', permanent: true },

      // Lockout Hasps
      { source: '/category/lockout-hasp', destination: '/category/lockout-hasps', permanent: true },
      { source: '/category/safety-hasps', destination: '/category/lockout-hasps', permanent: true },

      // Lockout Padlocks
      { source: '/category/lockout-padlock', destination: '/category/lockout-padlocks', permanent: true },
      { source: '/category/safety-padlocks', destination: '/category/lockout-padlocks', permanent: true },

      // Wireways
      { source: '/category/wireway', destination: '/category/wireways', permanent: true },
      { source: '/category/cable-trays', destination: '/category/wireways', permanent: true },
      { source: '/category/cable-raceways', destination: '/category/wireways', permanent: true },

      // Fall Protection Kits
      { source: '/category/fall-protection-kit', destination: '/category/fall-protection-kits', permanent: true },
      { source: '/category/safety-harness-kits', destination: '/category/fall-protection-kits', permanent: true },

      // Fire Blankets
      { source: '/category/fire-blanket', destination: '/category/fire-blankets', permanent: true },
      { source: '/category/safety-blankets', destination: '/category/fire-blankets', permanent: true },

      // Floodlights
      { source: '/category/flood-lights', destination: '/category/floodlights', permanent: true },
      { source: '/category/flood-lighting', destination: '/category/floodlights', permanent: true },

      // Bag Air Filters
      { source: '/category/bag-filters', destination: '/category/bag-air-filters', permanent: true },
      { source: '/category/pocket-filters', destination: '/category/bag-air-filters', permanent: true },

      // Lab Tables
      { source: '/category/lab-table', destination: '/category/lab-tables', permanent: true },
      { source: '/category/laboratory-tables', destination: '/category/lab-tables', permanent: true },

      // Track Light Fixtures
      { source: '/category/track-lights', destination: '/category/track-light-fixtures', permanent: true },
      { source: '/category/track-lighting', destination: '/category/track-light-fixtures', permanent: true },

      // Respirator Fit Testing
      { source: '/category/fit-testing', destination: '/category/respirator-fit-testing', permanent: true },
      { source: '/category/respirator-testing', destination: '/category/respirator-fit-testing', permanent: true },

      // Traction Devices
      { source: '/category/ice-cleats', destination: '/category/traction-devices', permanent: true },
      { source: '/category/shoe-traction', destination: '/category/traction-devices', permanent: true },

      // Protective Sleeves
      { source: '/category/arm-sleeves', destination: '/category/protective-sleeves', permanent: true },
      { source: '/category/safety-sleeves', destination: '/category/protective-sleeves', permanent: true },

      // Cleaning Buckets
      { source: '/category/cleaning-bucket', destination: '/category/cleaning-buckets', permanent: true },
      { source: '/category/mop-buckets', destination: '/category/cleaning-buckets', permanent: true },

      // Cleaning Carts
      { source: '/category/cleaning-cart', destination: '/category/cleaning-carts', permanent: true },
      { source: '/category/janitorial-carts', destination: '/category/cleaning-carts', permanent: true },

      // Construction Adhesives
      { source: '/category/construction-adhesive', destination: '/category/construction-adhesives', permanent: true },
      { source: '/category/building-adhesives', destination: '/category/construction-adhesives', permanent: true },

      // Contact Adhesives
      { source: '/category/contact-adhesive', destination: '/category/contact-adhesives', permanent: true },
      { source: '/category/contact-cement', destination: '/category/contact-adhesives', permanent: true },

      // Hot Melt Adhesives
      { source: '/category/hot-melt', destination: '/category/hot-melt-adhesives', permanent: true },
      { source: '/category/hot-glue', destination: '/category/hot-melt-adhesives', permanent: true },

      // Instant Adhesives
      { source: '/category/instant-adhesive', destination: '/category/instant-adhesives', permanent: true },
      { source: '/category/super-glue', destination: '/category/instant-adhesives', permanent: true },
      { source: '/category/cyanoacrylate', destination: '/category/instant-adhesives', permanent: true },

      // Spray Adhesives
      { source: '/category/spray-adhesive', destination: '/category/spray-adhesives', permanent: true },
      { source: '/category/adhesive-spray', destination: '/category/spray-adhesives', permanent: true },

      // Wood Glues
      { source: '/category/wood-glue', destination: '/category/wood-glues', permanent: true },
      { source: '/category/wood-adhesive', destination: '/category/wood-glues', permanent: true },

      // Caulks & Sealants
      { source: '/category/caulk', destination: '/category/caulks-sealants', permanent: true },
      { source: '/category/sealant', destination: '/category/caulks-sealants', permanent: true },
      { source: '/category/silicone-sealants', destination: '/category/caulks-sealants', permanent: true },

      // Pipe Sealants
      { source: '/category/pipe-sealant', destination: '/category/pipe-sealants', permanent: true },
      { source: '/category/thread-sealants', destination: '/category/pipe-sealants', permanent: true },

      // Bulk Bags
      { source: '/category/fibc', destination: '/category/bulk-bags', permanent: true },
      { source: '/category/jumbo-bags', destination: '/category/bulk-bags', permanent: true },
      { source: '/category/ton-bags', destination: '/category/bulk-bags', permanent: true },

      // Label Protection Tape
      { source: '/category/label-tape', destination: '/category/label-protection-tape', permanent: true },
      { source: '/category/label-cover-tape', destination: '/category/label-protection-tape', permanent: true },

      // Quiet Packing Tape
      { source: '/category/low-noise-tape', destination: '/category/quiet-packing-tape', permanent: true },
      { source: '/category/silent-tape', destination: '/category/quiet-packing-tape', permanent: true },

      // Strapping Bands
      { source: '/category/strapping-band', destination: '/category/strapping-bands', permanent: true },
      { source: '/category/plastic-strapping', destination: '/category/strapping-bands', permanent: true },

      // Stretch Wrap Rolls
      { source: '/category/stretch-film-rolls', destination: '/category/stretch-wrap-rolls', permanent: true },
      { source: '/category/pallet-wrap-rolls', destination: '/category/stretch-wrap-rolls', permanent: true },

      // Modular Tool Storage Systems
      { source: '/category/modular-tool-storage', destination: '/category/modular-tool-storage-systems', permanent: true },
      { source: '/category/tool-storage-modules', destination: '/category/modular-tool-storage-systems', permanent: true },

      // ==========================================
      // 产品页面重定向 (基于 Google Search Console 404 报告)
      // ==========================================

      // Welding Protection -> Welding Protective Clothing
      { source: '/product/welding-protection/:slug*', destination: '/product/welding-protective-clothing/:slug*', permanent: true },

      // Cable Ties & Wire Accessories -> Wire & Cable Management
      { source: '/product/cable-ties-wire-accessories/:slug*', destination: '/product/wire-cable-management/:slug*', permanent: true },

      // Tape -> Adhesives, Sealants and Tape
      { source: '/product/tape/:slug*', destination: '/product/adhesives-sealants-and-tape/:slug*', permanent: true },

      // Hand Protection -> Hand & Arm Protection
      { source: '/product/hand-protection/:slug*', destination: '/product/hand-arm-protection/:slug*', permanent: true },

      // Hand & Arm Protection -> Hand & Arm Protection (统一格式)
      { source: '/product/hand-and-arm-protection/:slug*', destination: '/product/hand-arm-protection/:slug*', permanent: true },

      // Storage & Shelving -> Tool Storage
      { source: '/product/storage-shelving/:slug*', destination: '/product/tool-storage/:slug*', permanent: true },

      // Entrance Mats & Floor Safety -> Floor Mats
      { source: '/product/entrance-mats-floor-safety/:slug*', destination: '/product/floor-mats/:slug*', permanent: true },

      // Valves & Hose Fittings -> Pipe, Hose, Tube & Fittings
      { source: '/product/valves-hose-fittings/:slug*', destination: '/product/pipe-hose-tube-fittings/:slug*', permanent: true },

      // Air Filters -> HVAC and Refrigeration
      { source: '/product/air-filters/:slug*', destination: '/product/hvac-and-refrigeration/:slug*', permanent: true },

      // Slings & Rigging -> Lifting, Pulling & Positioning
      { source: '/product/slings-rigging/:slug*', destination: '/product/lifting-pulling-positioning/:slug*', permanent: true },

      // First Aid Kits -> First Aid & Wound Care
      { source: '/product/first-aid-kits/:slug*', destination: '/product/first-aid-wound-care/:slug*', permanent: true },

      // Carts & Trucks -> Material Handling
      { source: '/product/carts-trucks/:slug*', destination: '/product/material-handling/:slug*', permanent: true },

      // Transporting -> Material Handling
      { source: '/product/transporting/:slug*', destination: '/product/material-handling/:slug*', permanent: true },

      // Gears & Gear Drives -> Power Transmission
      { source: '/product/gears-gear-drives/:slug*', destination: '/product/power-transmission/:slug*', permanent: true },

      // Work Platforms -> Ladders, Platforms & Personnel Lifts
      { source: '/product/work-platforms/:slug*', destination: '/product/ladders-platforms-personnel-lifts/:slug*', permanent: true },

      // Hearing Protection -> Safety
      { source: '/product/hearing-protection/:slug*', destination: '/product/safety/:slug*', permanent: true },

      // Linen Carts -> Cleaning and Janitorial
      { source: '/product/linen-carts/:slug*', destination: '/product/cleaning-and-janitorial/:slug*', permanent: true },

      // Task & Jobsite Lighting -> Lighting
      { source: '/product/task-jobsite-lighting/:slug*', destination: '/product/lighting/:slug*', permanent: true },

      // ==========================================
      // 分类页面重定向 (基于 Google Search Console 404 报告)
      // ==========================================

      // Linen Carts -> Cleaning and Janitorial
      { source: '/category/linen-carts', destination: '/category/cleaning-and-janitorial', permanent: true },
      { source: '/category/linen-carts/:path*', destination: '/category/cleaning-and-janitorial/:path*', permanent: true },

      // Task & Jobsite Lighting -> Lighting
      { source: '/category/task-jobsite-lighting', destination: '/category/lighting', permanent: true },
      { source: '/category/task-jobsite-lighting/:path*', destination: '/category/lighting/:path*', permanent: true },

      // ==========================================
      // 其他常见 404 路径重定向
      // ==========================================

      // 旧的产品列表页面
      { source: '/products', destination: '/category/safety', permanent: true },
      { source: '/products/:path*', destination: '/category/safety', permanent: true },

      // 旧的分类路径格式
      { source: '/c/:slug', destination: '/category/:slug', permanent: true },
      { source: '/c/:slug/:path*', destination: '/category/:slug/:path*', permanent: true },

      // 旧的商店路径
      { source: '/shop', destination: '/', permanent: true },
      { source: '/shop/:path*', destination: '/category/:path*', permanent: true },

      // 旧的目录路径
      { source: '/catalog', destination: '/', permanent: true },
      { source: '/catalog/:path*', destination: '/category/:path*', permanent: true },

      // 带 .html 后缀的旧路径
      { source: '/category/:slug.html', destination: '/category/:slug', permanent: true },
      { source: '/product/:category/:slug.html', destination: '/product/:category/:slug', permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
