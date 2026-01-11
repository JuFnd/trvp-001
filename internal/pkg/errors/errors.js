const ErrNotFound = new Error('Not Found');
const ErrEntityAlreadyExist = new Error('Entity already exists');
const ErrInvalidInput = new Error('Invalid input');
const ErrConflict = new Error('Conflict');

export default {
  ErrNotFound,
  ErrEntityAlreadyExist,
  ErrInvalidInput,
  ErrConflict,
};

export { ErrNotFound, ErrEntityAlreadyExist, ErrInvalidInput, ErrConflict };