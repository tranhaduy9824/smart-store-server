exports.getPublicIdFromUrl = (url) => {
  if (typeof url === 'undefined' || url === null) {
    return null;
  }
  
  const matches = url.match(/\/upload\/(?:v\d+\/)?([^/.]+)/);
  if (matches) {
    const publicId = matches[1].replace(/%20/g, " ");
    return publicId;
  }
  return null;
};
