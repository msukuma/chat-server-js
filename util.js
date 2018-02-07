exports.inherit = function inherit(child, parent) {
  for (let key in parent) {
    if (!child.hasOwnProperty(key)) child[key] = parent[key];
  }
};
