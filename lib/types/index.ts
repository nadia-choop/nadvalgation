// Shared types across both frontend and backend!

export type WeatherResponse = {
    raining: boolean;
};

export type Location = {
  id: string;
  name: string;
  address: string;
  visited: boolean;
  rating: number | null;
  comment: string | null;
};

export type Collection = {
  id: string;
  name: string;
  description: string;
  locations: Location[];
};
