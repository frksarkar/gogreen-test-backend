import jwt from "jsonwebtoken";
export const verifyJwtToken = (token: string, secret: string) => {
  const verifiedToken = jwt.verify(token, secret);
  return verifiedToken;
};
