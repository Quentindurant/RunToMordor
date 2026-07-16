// Obtenez votre token sur https://the-one-api.dev/signup
const BEARER_TOKEN = 'YOUR_BEARER_TOKEN_HERE';
const API_BASE_URL = 'https://the-one-api.dev/v2';

const authHeaders = {
  Authorization: `Bearer ${BEARER_TOKEN}`,
  'Content-Type': 'application/json',
};

export interface Quote {
  _id: string;
  dialog: string;
  movie: string;
  character: string;
}

export interface ApiCharacter {
  _id: string;
  name: string;
  race: string;
  gender: string;
  realm: string;
  wikiUrl: string;
}

// Fetch une citation aléatoire. Total quotes: ~2384.
export const fetchRandomQuote = async (): Promise<Quote | null> => {
  try {
    const randomOffset = Math.floor(Math.random() * 2300);
    const res = await fetch(
      `${API_BASE_URL}/quote?limit=1&offset=${randomOffset}`,
      { headers: authHeaders }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { docs: Quote[] } = await res.json();
    return data.docs[0] ?? null;
  } catch (err) {
    console.warn('[OneRingAPI] fetchRandomQuote failed:', err);
    return null;
  }
};

export const fetchCharacterById = async (id: string): Promise<ApiCharacter | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/character/${id}`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { docs: ApiCharacter[] } = await res.json();
    return data.docs[0] ?? null;
  } catch (err) {
    console.warn('[OneRingAPI] fetchCharacterById failed:', err);
    return null;
  }
};

// Récupère quelques personnages connus pour la liste Lore
export const fetchFellowshipCharacters = async (): Promise<ApiCharacter[]> => {
  // IDs fixes de la Communauté de l'Anneau (pour éviter pagination)
  const knownIds = [
    '5cd99d4bde30eff6ebccfbe6', // Gandalf
    '5cd99d4bde30eff6ebccfea0', // Frodo
    '5cd99d4bde30eff6ebccfd0d', // Legolas
    '5cd99d4bde30eff6ebccfc15', // Aragorn
  ];
  try {
    const res = await fetch(
      `${API_BASE_URL}/character?_id=${knownIds.join(',')}&limit=4`,
      { headers: authHeaders }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: { docs: ApiCharacter[] } = await res.json();
    return data.docs;
  } catch (err) {
    console.warn('[OneRingAPI] fetchFellowshipCharacters failed:', err);
    return [];
  }
};
