exports.inherit = function inherit(child, parent) {
  for (let key in parent) {
    child[key] = parent[key];
  }
};
