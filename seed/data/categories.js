/**
 * Category seed data.
 * Matches the Category schema exactly: name, slug, icon, image{url,publicId}, isActive, sortOrder.
 */

const categories = [
  { name: 'Laptops', slug: 'laptops', icon: 'laptop_mac_rounded', sortOrder: 1 },
  { name: 'Phones', slug: 'phones', icon: 'smartphone_rounded', sortOrder: 2 },
  { name: 'Tablets', slug: 'tablets', icon: 'tablet_mac_rounded', sortOrder: 3 },
  { name: 'iPads', slug: 'ipads', icon: 'tablet_rounded', sortOrder: 4 },
  { name: 'AirPods', slug: 'airpods', icon: 'earbuds_rounded', sortOrder: 5 },
  { name: 'Headphones', slug: 'headphones', icon: 'headphones_rounded', sortOrder: 6 },
  { name: 'Smart Watches', slug: 'smart-watches', icon: 'watch_rounded', sortOrder: 7 },
  { name: 'Gaming', slug: 'gaming', icon: 'sports_esports_rounded', sortOrder: 8 },
  { name: 'Monitors', slug: 'monitors', icon: 'desktop_windows_rounded', sortOrder: 9 },
  { name: 'Keyboards', slug: 'keyboards', icon: 'keyboard_rounded', sortOrder: 10 },
  { name: 'Mice', slug: 'mice', icon: 'mouse_rounded', sortOrder: 11 },
  { name: 'Cameras', slug: 'cameras', icon: 'camera_alt_rounded', sortOrder: 12 },
  { name: 'Speakers', slug: 'speakers', icon: 'speaker_rounded', sortOrder: 13 },
  { name: 'Chargers', slug: 'chargers', icon: 'bolt_rounded', sortOrder: 14 },
  { name: 'Accessories', slug: 'accessories', icon: 'cable_rounded', sortOrder: 15 },
].map((c) => ({ ...c, image: { url: null, publicId: null }, isActive: true }));

module.exports = categories;