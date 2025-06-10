import GoldTemplate from './GoldTemplate';
import MaroonCertificate from './MaroonCertificate';
import RoyalBlueTemplate from './RoyalBlueTemplate';
import ElegantBlackTemplate from './ElegantGreenTemplate';
export const certificateTemplates = [
  {
    id: 'modern-gold',
    name: 'Modern Gold',
    component: GoldTemplate,
  },
  {
    id: 'classic-maroon',
    name: 'Classic Maroon',
    component: MaroonCertificate,
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    component: RoyalBlueTemplate,
  },
  {
    id: 'e;legant-black',
    name: 'Elegant Black',
    component: ElegantBlackTemplate,
  },
];
export default certificateTemplates;