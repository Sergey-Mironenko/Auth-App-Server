import { emailService } from '../services/email.service.js';
import { userService } from '../services/user.service.js';
import { jwtService } from '../services/jwt.service.js';
import { tokenService } from '../services/token.service.js';
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcrypt';
import { ApiError } from '../exeptions/ApiError.js';
import { isEmailInvalid, isPasswordInvalid } from '../utils/functions.js';
import { sendAuthentication } from './global.controllers.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const activationToken = uuidv4();
  const emailError = isEmailInvalid(email);
  const passwordError = isPasswordInvalid(password);

  if (emailError) {
    throw ApiError.BadRequest(emailError);
  }

  if (passwordError) {
    throw ApiError.BadRequest(passwordError);
  }

  const user = await userService.getByEmail(email);

  if (user) {
    throw ApiError.Conflict('User with this e-mail already exists');
  }

  await emailService.sendActivationEmail(email, activationToken);

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await userService.create(name, email, hashPassword, activationToken);

  res.status(201);
  res.send(userService.normalize(newUser));   
};

export const activation = async (req, res) => {
  const { activationToken } = req.params;

  const user = await userService.getByToken(activationToken);

  if (!user) {
    throw ApiError.NotFound('No one to activate');
  }

  user.activationToken = null;
  await user.save();

  await sendAuthentication(res, user);
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.BadRequest('No user wuth such email');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw ApiError.BadRequest('Wrong password');
  }

  if (user.activationToken) {
    throw ApiError.Forbidden('Activate your account first');
  }

  await sendAuthentication(res, user);
};

export const verify = async (req, res) => {
  const { email } = req.body;
  const verifyToken = uuidv4();

  const user = await userService.getByEmail(email);

  if (user && !user.activationToken) {
    await emailService.sendToken(email, verifyToken, 'Password');   

    res.status(200);
    
    res.cookie(`verify-${email}`, verifyToken, {
      httpOnly: true,
      maxAge: 20 * 60 * 1000,
      sameSite: 'none',
      secure: true,
    });
    res.send(userService.normalize(user));
    
    return;
  }

  if (user && user.activationToken) {
    throw ApiError.Forbidden('Activate your account first');
  }

  throw ApiError.BadRequest('No user with such email');    
};

export const getCredentials = async (req, res) => {
  const { credentials } = req.cookies;
  const parsedCredentials = credentials ? JSON.parse(credentials) : null;

  if (!parsedCredentials
    || !parsedCredentials.email
    || !parsedCredentials.password) {
    throw ApiError.NotFound();
  }

  res.send(parsedCredentials);
};

export const compareTokens = async (req, res) => {
  const { email, token } = req.body;
  const verifyToken = req.cookies[`verify-${email}`];

  if (!verifyToken) {
    throw ApiError.NotFound('Token is incorrect or too old');
  }

  if (verifyToken !== token) {
    throw ApiError.BadRequest('Tokens do not match');
  }

  res.sendStatus(200);
};

export const rememberCredentials = async (req, res) => {
  const { email, password } = req.body;
  const credentials = JSON.stringify({
    email,
    password,
  })

  res.cookie('credentials', credentials, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none',
    secure: true,
  });
  res.sendStatus(200);
};

export const clearCredentials = async (req, res) => {
  res.clearCookie('credentials', {
    sameSite: 'none',
  });
  res.sendStatus(200);
};

export const reset = async (req, res) => {
  const { email, newPassword } = req.body;
  const passwordError = isPasswordInvalid(newPassword);

  if (passwordError) {
    throw ApiError.BadRequest(passwordError);
  }

  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.NotFound();
  }
 
  const isPasswordUsed = await bcrypt.compare(newPassword, user.password);

  if (isPasswordUsed) {
   throw ApiError.Forbidden('You already use this password');
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashPassword;
  await user.save();

  res.send(userService.normalize(user));
};

export const refresh = async (req, res, next) => {
  const { refreshToken } = req.cookies;
  const verifiedUser = jwtService.verifyRefresh(refreshToken);

  if (!verifiedUser) {
    throw ApiError.Unauthorized('Failed to refresh');
  }

  const token = await tokenService.getByToken(refreshToken);

  if (!token) {
    throw ApiError.Unauthorized('Failed to refresh');
  }

  const user = await userService.getByEmail(verifiedUser.email);

  if (!user) {
    throw ApiError.Unauthorized('Failed to refresh');
  }

  await sendAuthentication(res, user);
};
