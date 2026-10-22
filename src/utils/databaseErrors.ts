export function isUniqueViolation(error: any): boolean {
  return error && error.code === '23505';
}

const mod = {
  isUniqueViolation,
};

module.exports = mod;
export default mod;
