import GoldTemplate from './GoldTemplate';
import MaroonCertificate from './MaroonCertificate';
import RoyalBlueTemplate from './RoyalBlueTemplate';
import ElegantGreenTemplate from './ElegantGreenTemplate';
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
    id: 'elegant-green',
    name: 'Elegant Green',
    component: ElegantGreenTemplate,
  },
];
export default certificateTemplates;