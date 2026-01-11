const Joi = require('joi');

function validateSignup(input) {
  const schema = Joi.object({
    login: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(input);
}

function validateSignin(input) {
  const schema = Joi.object({
    login: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(input);
}

module.exports = {
  validateSignup,
  validateSignin,
};
