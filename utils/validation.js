const getMissingFields = (data, requiredFields) =>
  requiredFields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

module.exports = {
  getMissingFields,
};
