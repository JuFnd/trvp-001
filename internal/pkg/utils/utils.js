const sendResponse = (res, req, status, body, message, error, logger) => {
  const response = {
    success: status >= 200 && status < 300,
    message: message || null,
    data: body,
  };

  if (status >= 400) {
    response.error = message;
    response.data = null;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(status).json(response);

  if (error) {
    logger.error(message, {
      method: req.method,
      status,
      path: req.path,
      error: error.message,
    });
  } else {
    logger.info(message, {
      method: req.method,
      status,
      path: req.path,
    });
  }
};

const getCookie = (name, value, path, httpOnly, expiresAt) => {
  return {
    name,
    value,
    options: {
      path,
      httpOnly,
      expires: expiresAt,
    },
  };
};

const randStringRunes = (seed) => {
  const symbols = [];
  const letterRunes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  for (let i = 0; i < seed; i++) {
    symbols[i] = letterRunes[Math.floor(Math.random() * letterRunes.length)];
  }

  return symbols.join('');
};

const randInt = () => {
  return Math.floor(Math.random() * 1000000000);
};

export default {
  sendResponse,
  getCookie,
  randStringRunes,
  randInt,
};