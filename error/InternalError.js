class InternalError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.message = message || 'Default Message';
    this.statusCode = statusCode || 500;
  }
}

module.exports = InternalError;