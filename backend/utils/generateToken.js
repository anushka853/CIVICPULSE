import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'civicpulse_secret_token_12345', {
    expiresIn: '30d',
  });
};

export default generateToken;
