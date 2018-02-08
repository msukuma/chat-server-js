module.exports = {
  inherit: inherit,
  isoTimeStamp: isoTimeStamp,
};

function inherit(child, parent) {
  for (let key in parent) {
    if (!child.hasOwnProperty(key)) child[key] = parent[key];
  }
}

function isoTimeStamp() {
  return new Date().toISOString();
}
