# Auth App Server
Server is created using Express, it alows to handle authentication, registration, changing data and some more processes. Logic is devided into routes, controlers, and services. Server has custom errors for every error caused by client. To prevent server from falling it has caching error middlewares in all routes which cach errors in controllers. Although it uses a custom middleware to handle any error and return an appropriate response.

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
- Checks if any user uses such password. If user is found or `newPassword` is used throws appropriate error.
- Hashes `newPassword` and replaces user's password in database. Id creates by default.
- Sends normalized user.

## logout controller
- Receives request and response as params.
- Receives `refreshToken` from request cookies.
- Verifies `refreshToken` and receives `verifiedUser` data.
- Removes `refreshToken` from client's cookies.
- If `verifiedUser` is not undefined removes `refreshToken` from database.
