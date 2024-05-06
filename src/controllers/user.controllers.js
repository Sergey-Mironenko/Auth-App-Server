import { userService } from '../services/user.service.js'
import { emailService } from '../services/email.service.js';
import { ApiError } from '../exeptions/ApiError.js';
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcrypt';
import { isEmailInvalid, isPasswordInvalid } from '../utils/functions.js';
import { sendAuthentication } from './global.controllers.js';
import { logout } from './global.controllers.js';

export const loadAllActivated = async (req, res) => {
  const allUsers = await userService.getAllActivated();

  res.send(allUsers.map(userService.normalize));
};

export const verifyPassword = async (req, res) => {
  const { email, password } = req.body;

  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.NotFound('It seams your email was changed');
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw ApiError.BadRequest('Wrong password');
  }

  res.send(userService.normalize(user));
};

export const rename = async (req, res) => {
  const { email, name } = req.body;
  
  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.NotFound('It seams your email was changed');
  }

  if (user.name === name) {
    throw ApiError.Conflict('You already use this name');
  }

  user.name = name;
  await user.save();

  await sendAuthentication(res, user);
};

export const verifyEmail = async (req, res) => {
  const { newEmail } = req.body;
  const resetToken = uuidv4();
  const emailError = isEmailInvalid(newEmail);

  if (emailError) {
    throw ApiError.BadRequest(emailError);
  }

  const user = await userService.getByEmail(newEmail);

  if (user) {
    throw ApiError.Conflict('User with this email already exists'); 
  }

  await emailService.sendToken(newEmail, resetToken, 'Email');

  res.status(200);
  res.cookie('resetToken', resetToken, {
    maxAge: 20 * 60 * 1000,
    httpOnly: true,
    sameSite: 'none',
    secure: true,
  });
  res.end();
};

export const resetEmail = async (req, res) => {
  const { oldEmail, newEmail, token } = req.body;
  const { resetToken } = req.cookies;

  if (!resetToken) {
    throw ApiError.NotFound('Token is too old. Please get new one');
  }

  if (token !== resetToken) {
    throw ApiError.BadRequest('Tokens do not match');
  }

  const user = await userService.getByEmail(oldEmail);

  if (!user) {
    throw ApiError.NotFound('It seams your email was changed');
  }

  await emailService.sendNotifyEmail(oldEmail, newEmail);

  user.email = newEmail;
  await user.save();

  res.clearCookie('credentials', {
    sameSite: 'none',
    secure: true,
  });
  res.clearCookie('resetToken', {
    sameSite: 'none',
    secure: true,
  });

  await sendAuthentication(res, user);
};

export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  const passwordError = isPasswordInvalid(newPassword);

  if (passwordError) {
    throw ApiError.BadRequest(passwordError);
  }

  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.NotFound('It seams your email was changed');
  }

  const isPasswordUsed = await bcrypt.compare(newPassword, user.password);

  if (isPasswordUsed) {
    throw ApiError.Conflict('You already use this password');
  }

  const hashPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashPassword;
  await user.save();

  res.clearCookie('credentials', {
    sameSite: 'none',
    secure: true,
  });

  await sendAuthentication(res, user);
};

export const deleteAccount = async (req, res) => {
  const { email, text } = req.body;

  const user = await userService.getByEmail(email);

  if (!user) {
    throw ApiError.Conflict('Already deleted');
  }

  if (text !== 'DELETE') {
    throw ApiError.NotFound('You have entered wrong text');
  }

  await userService.remove(email);
  await emailService.sendDeleteEmail(email);

  await logout(req, res);
};
