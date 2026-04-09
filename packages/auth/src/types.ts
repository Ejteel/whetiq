export interface WhetIQSession {
  user: {
    email: string;
    name: string | null;
    image: string | null;
  };
  expires: string;
}
