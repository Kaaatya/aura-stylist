export type BodyType = 'Hourglass' | 'Pear' | 'Apple' | 'Rectangle' | 'Inverted Triangle' | 'Unknown';

export interface UserProfile {
  height: number; // cm
  weight: number; // kg
  measurements: {
    bust: number;
    waist: number;
    hips: number;
  };
  bodyType: BodyType;
  stylePreferences: string[];
  budget: number;
}

export interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  imageUrl: string;
  tags: string[];
}

export interface OutfitSuggestion {
  id: string;
  items: WardrobeItem[];
  reasoning: string;
  occasion: string;
}

export interface CapsuleWardrobe {
  id: string;
  items: WardrobeItem[];
  totalCost: number;
  theme: string;
}
