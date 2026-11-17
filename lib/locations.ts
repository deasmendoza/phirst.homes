export type Island = 'luzon' | 'visayas' | 'mindanao';

export interface Development {
  name: string;
  /** Road and barangay where a public source gives one; otherwise just the town and province. */
  address: string;
  island: Island;
}

export interface LocationGroup {
  id: string;
  name: string;
  /** Pins on the map: [longitude, latitude] of the towns in this group. */
  pins: { island: Island; at: [number, number] }[];
  developments: Development[];
}

// Addresses come from public listings and news reports, not from official project
// documents. Where sources disagreed or gave nothing, only the town is shown.
export const LOCATIONS: LocationGroup[] = [
  {
    id: 'cavite',
    name: 'Cavite',
    pins: [{ island: 'luzon', at: [120.85, 14.33] }],
    developments: [
      { name: 'Naic', address: "Governor's Drive, Brgy. Halang, Sabang & San Roque, Naic, Cavite", island: 'luzon' },
      { name: 'Naic Expansion', address: 'Naic, Cavite', island: 'luzon' },
      { name: 'Gen Tri', address: 'Governor Ferrer Drive, Brgy. Buenavista II, General Trias, Cavite', island: 'luzon' },
      { name: 'Impressions Gen Tri', address: 'Brgy. Biclatan, General Trias, Cavite', island: 'luzon' },
      { name: 'Tanza', address: "Governor's Drive, Brgy. Tanauan, Tanza, Cavite", island: 'luzon' },
    ],
  },
  {
    id: 'batangas',
    name: 'Batangas',
    pins: [{ island: 'luzon', at: [121.02, 13.95] }],
    developments: [
      { name: 'Lipa', address: 'Brgy. San Lucas, Lipa City, Batangas', island: 'luzon' },
      { name: 'Lipa Cove', address: 'Brgy. San Lucas, Lipa City, Batangas', island: 'luzon' },
      { name: 'Sto. Tomas', address: 'Sto. Tomas, Batangas', island: 'luzon' },
      { name: 'Batulao', address: 'Brgy. Kaylaway, Nasugbu, Batangas', island: 'luzon' },
      { name: 'Impressions Batulao', address: 'Nasugbu, Batangas', island: 'luzon' },
      { name: 'Impressions Batulao Expansion', address: 'Nasugbu, Batangas', island: 'luzon' },
      { name: 'Editions Batulao Vol.1', address: 'Nasugbu, Batangas', island: 'luzon' },
      { name: 'Editions Batulao Vol.2 East', address: 'Nasugbu, Batangas', island: 'luzon' },
      { name: 'Editions Batulao Vol.2 West', address: 'Nasugbu, Batangas', island: 'luzon' },
      { name: 'Sights Batangas', address: 'Batangas', island: 'luzon' },
    ],
  },
  {
    id: 'laguna',
    name: 'Laguna',
    pins: [{ island: 'luzon', at: [121.27, 14.17] }],
    developments: [
      { name: 'Calamba', address: 'Brgy. Palo Alto, Calamba, Laguna', island: 'luzon' },
      { name: 'Calamba West', address: 'Calamba, Laguna', island: 'luzon' },
      { name: 'San Pablo East', address: 'San Pablo City, Laguna', island: 'luzon' },
      { name: 'Sights Bay', address: 'Brgy. Puypuy, Bay, Laguna', island: 'luzon' },
      { name: 'Sights Calauan', address: 'Brgy. Hanggan, Calauan, Laguna', island: 'luzon' },
      { name: 'Sights Calauan West', address: 'Calauan, Laguna', island: 'luzon' },
    ],
  },
  {
    id: 'quezon',
    name: 'Quezon',
    pins: [{ island: 'luzon', at: [121.59, 14.03] }],
    developments: [
      { name: 'Tayabas', address: 'Brgy. Mayowe, Tayabas City, Quezon', island: 'luzon' },
      { name: 'Sights Tayabas', address: 'Tayabas City, Quezon', island: 'luzon' },
    ],
  },
  {
    id: 'bulacan',
    name: 'Bulacan',
    pins: [{ island: 'luzon', at: [120.93, 14.92] }],
    developments: [
      { name: 'Baliwag', address: 'Brgy. Makinabang, Baliwag, Bulacan', island: 'luzon' },
      { name: 'Baliwag Expansion', address: 'Baliwag, Bulacan', island: 'luzon' },
      { name: 'Impressions Baliwag', address: 'Baliwag, Bulacan', island: 'luzon' },
      { name: 'Pandi Expansion', address: 'Pandi, Bulacan', island: 'luzon' },
    ],
  },
  {
    id: 'nueva-ecija',
    name: 'Nueva Ecija',
    pins: [{ island: 'luzon', at: [120.95, 15.31] }],
    developments: [{ name: 'Gapan', address: 'Brgy. Sto. Cristo Sur & Malimba, Gapan City, Nueva Ecija', island: 'luzon' }],
  },
  {
    id: 'pampanga',
    name: 'Pampanga',
    pins: [{ island: 'luzon', at: [120.66, 15.21] }],
    developments: [{ name: 'Magalang East', address: 'Magalang, Pampanga', island: 'luzon' }],
  },
  {
    id: 'bataan',
    name: 'Bataan',
    pins: [{ island: 'luzon', at: [120.52, 14.75] }],
    developments: [
      { name: 'Balanga', address: 'Balanga City, Bataan', island: 'luzon' },
      { name: 'Impressions Hermosa', address: 'Hermosa, Bataan', island: 'luzon' },
      { name: 'Hermosa Fairgrounds', address: 'Hermosa, Bataan', island: 'luzon' },
    ],
  },
  {
    id: 'visayas-mindanao',
    name: 'Visayas & Mindanao',
    pins: [
      { island: 'visayas', at: [122.95, 10.68] },
      { island: 'visayas', at: [122.56, 10.72] },
      { island: 'mindanao', at: [125.17, 6.11] },
      { island: 'mindanao', at: [125.36, 6.75] },
    ],
    developments: [
      { name: 'Bacolod', address: 'Brgy. Estefania (Vista Alegre), Bacolod City, Negros Occidental', island: 'visayas' },
      { name: 'Iloilo', address: 'Iloilo', island: 'visayas' },
      { name: 'Gensan', address: 'Sarangani–Davao del Sur Coastal Road, Brgy. Baluan, General Santos City', island: 'mindanao' },
      { name: 'Sights Digos', address: 'Digos City, Davao del Sur', island: 'mindanao' },
    ],
  },
];

export const ISLANDS: { id: Island; label: string }[] = [
  { id: 'luzon', label: 'Luzon' },
  { id: 'visayas', label: 'Visayas' },
  { id: 'mindanao', label: 'Mindanao' },
];
