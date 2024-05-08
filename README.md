<<<<<<< HEAD
# Auth App Server
Server is created using Express, it alows to handle authentication, registration, changing data and some more processes. Logic is devided into routes, controlers, and services. Server has custom errors for every error caused by client. To prevent server from falling it has caching error middlewares in all routes which cach errors in controllers. Although it uses a custom middleware to handle any error and return an appropriate response.
=======
# Authentication App Server
A single-page application that alows user to register, login or change the password. Loged user can see the list of all activated users, change his name password or email. Implements the look and behaviour of old computers.
>>>>>>> 0ac51c7caa5dbdec250cacbdc95ef7e1e8cc4e29

# Table of contents
- [Technologies used](#technologies-used)
- [Structure](#structure)
- [Controllers](#controllers)

# Technologies used
- JavaScript
- API
- Node.js
- Espress
- uuid
- SQL
- ORM
- Nodemailer
- JWT

# Structure
Server uses two types of routes and `errorMiddleware`, that in case of error receives it, end returns it with it's message, if error is caused by client, otherwisу returns `Server error` message. First type of routs handles requests that can only be sent by non authenticated user, second - by authenticated. In both types of routes have been used a `catchError` middleware to cach errors in controller and a controller itself. There are three types of controllers: for non authenticated user actions, for authenticated, and for actions independent from authentication. Authentication and refresh process is implemented using `JWT` tokens by sending an access token, and setting refresh token into cookies, that can only be read by server. If client has access token it sets it into request headers. Although authenticated user routes have an `authMiddleware`, that checks if request has an access token in headers, and if token is valid, if something is wrong it throws an authorization error. Registered users and refresh tokens are stored in SQL database.

# Controllers

## sendAuthentication controller
- Receives response and user object as params.
- Creates access and refresh tokens.
- Saves refresh token into database (user id is a primary key).
- Sets refresh token in cookies for one day.
- Returns access token and normalized user (only id, email and name) in order to save most secret data.

## refresh controller
- Receives request and response as params.
- Receives `refreshToken` from request cookies.
- Verifies `refreshToken` and receives `verifiedUser` data, in case of error throws appropriate error.
- Finds `refreshToken` in database, if token hasn't been found throws appropriate error.
- Finds user in database by `verifiedUser` email.
- If user haven't been found throws appropriate error.
- Calls `sendAuthentication` function.

## register controller
- Receives request and response as params.
- Receives `name`, `email` and `password` from request body.
- Creates an activation token with `uuid`.
- Checks if `email` and `password` are valid.
- Checks if any user uses such email. If user is found or email is used throws appropriate error.
- Sends email with activation link.
- Hashes `password` and creates new user in database with such fields: `name`, `email`, hashed password and activation token. Id creates by default.
- Sends created user.

## activation controller
- Receives request and response as params.
- Receives activation token from request body.
- Finds user in database by this token.
- If user haven't been found throws appropriate error.
- Sets user's activation token to `null`.
- Calls `sendAuthentication` function.

## verify controller
- Receives request and response as params.
- Receives `email` from request body.
- Creates `verifyToken` with `uuid`.
- Finds user in database by this token.
- If user haven't been found or user's activation token is not `null` throws appropriate error.
- Sends email with `verifyToken` and sets this token in client's cookies.

## login controller
- Receives request and response as params.
- Receives `email` and `password` from request body.
- Finds user in database by `email`.
- If user haven't been found throws appropriate error.
- Checks if `password` is correct.
- Checks if this user is activated (`activationToken === null`).
- Calls `sendAuthentication` function.

## rememberCredentials controller
- Receives request and response as params.
- Receives `email` and `password` from request body.
- Stringifies them to JSON object.
- Sets this object in client's cookies.

## getCredentials controller
- Receives request and response as params.
- Receives `credentials` from request cookies.
- Parses `credentials` and checks if it has email and password.
- If not throws appropriate error.
- Sends parsed `credentials`.

## clearCredentials controller
- Removes `credentials` from client's cookies.

## compareTokens controller
- Receives request and response as params.
- Receives `email` and `token` from request body.
- Receives `verifyToken` from request cookies.
- If there is no `token` or `token` is different from `verifyToken` throws appropriate error.
- Sends status `200` if everithing is ok.

## login controller
- Receives request and response as params.
- Receives `email` and `password` from request body.
- Finds user in database by `email`.
- If user haven't been found throws appropriate error.
- Checks if `password` is correct.
- Checks if this user is activated (`activationToken === null`).
- Calls `sendAuthentication` function.

## reset controller
- Receives request and response as params.
- Receives `email` and `newPassword` from request body.
- Checks if `newPassword` is valid, if not throws appropriate error.
- Finds user in database by `email`.
- If user haven't been found throws appropriate error.
- Checks if any user uses such password. If `newPassword` is used throws appropriate error.
- Hashes `newPassword` and changes user's password in database.
- Sends normalized user.

## logout controller
- Receives request and response as params.
- Receives `refreshToken` from request cookies.
- Verifies `refreshToken` and receives `verifiedUser` data.
- Removes `refreshToken` from client's cookies.
- If `verifiedUser` is not undefined removes `refreshToken` from database.

## loadAllActivated controller
- Finds all activated users in database.
- Normalizes and sends them.

## verifyPassword controller
- Receives request and response as params.
- Receives `email` and `password` from request body.
- Finds user in database by `email`.
- Checks if `password` is correct.

## rename controller
- Receives request and response as params.
- Receives `email` and `name` from request body.
- Finds user in database by `email`.
- Checks if `name` is not used, if used throws appropriate error.
- Changes user's name in database.
- Calls `sendAuthentication` function.

## verifyEmail controller
- Receives request and response as params.
- Receives `newEmail` from request body.
- Creates `resetToken` with `uuid`.
- Checks if `newEmail` is valid and not used, if something is wrong throws appropriate error.
- Sends `resetToken` to user's email and sets it in client's cookies.
- Calls `sendAuthentication` function.

## resetEmail controller
- Receives request and response as params.
- Receives `oldEmail`, `newEmail` and `token` from request body.
- Receives `resetToken` from request cookies.
- If there is no `resetToken` or `resetToken` is different from `token` throws appropriate error.
- Finds user in database by `email`.
- Sends a notify email to user's old email.
- Changes users email in database.
- Calls `sendAuthentication` function.

## resetPassword controller
- Receives request and response as params.
- Receives `email`, `newPassword` from request body.
- Checks if `newPassword` is valid, if not throws appropriate error.
- Finds user in database by `email`.
- Checks if any user uses such password. If `newPassword` is used throws appropriate error.
- Hashes `newPassword` and changes user's password in database.
- Removes saved `credentials` (in case if they are saved) from client's cookies.
- Calls `sendAuthentication` function.

## deleteAccount controller
- Receives request and response as params.
- Receives `email`, `text` from request body.
- Finds user in database by `email`.
- If user haven't been found or `text` is different from `DELETE` throws appropriate error.
- Removes User from database and sends email about deleting account.
- Calls `logout` function.
