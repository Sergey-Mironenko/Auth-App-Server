import { jwtService } from "../services/jwt.service.js";
import { tokenService } from "../services/token.service.js";
import { userService } from "../services/user.service.js";

export const sendAuthentication = async (res, user) => {
  const normalizedUser = userService.normalize(user);
  const { accessToken, refreshToken } = jwtService.sign(normalizedUser);

  await tokenService.save(user.id, refreshToken);
  
  res.cookie('refreshToken', refreshToken, {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  
  res.send({
    user: normalizedUser,
    accessToken,
  });
};
