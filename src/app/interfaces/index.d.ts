import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface User {
      role?: string | string[] | null;
      id?: string | null;
      email?: string | null;
      [key: string]: unknown;
    }
  }
}
