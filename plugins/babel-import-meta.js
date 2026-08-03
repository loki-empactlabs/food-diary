/**
 * Babel plugin to transform import.meta.env references into process.env equivalents.
 *
 * Metro bundles JS as a non-module <script>, so import.meta causes SyntaxError.
 * This transforms:
 *   import.meta.env.MODE  →  process.env.NODE_ENV
 *   import.meta.env       →  { MODE: process.env.NODE_ENV }
 */
module.exports = function () {
  return {
    visitor: {
      MetaProperty(path) {
        const { node, parent } = path;
        // Match import.meta
        if (node.meta.name === 'import' && node.property.name === 'meta') {
          // import.meta.env.MODE → process.env.NODE_ENV
          if (
            parent.type === 'MemberExpression' &&
            parent.property.name === 'env'
          ) {
            const grandParent = path.parentPath.parent;
            if (
              grandParent &&
              grandParent.type === 'MemberExpression' &&
              grandParent.property.name === 'MODE'
            ) {
              // Replace the whole import.meta.env.MODE with process.env.NODE_ENV
              path.parentPath.parentPath.replaceWithSourceString(
                'process.env.NODE_ENV'
              );
            } else if (
              grandParent &&
              grandParent.type === 'ConditionalExpression'
            ) {
              // import.meta.env ? import.meta.env.MODE : void 0
              // Replace import.meta.env with { MODE: process.env.NODE_ENV }
              path.parentPath.replaceWithSourceString(
                '({ MODE: process.env.NODE_ENV })'
              );
            } else {
              // Generic import.meta.env → { MODE: process.env.NODE_ENV }
              path.parentPath.replaceWithSourceString(
                '({ MODE: process.env.NODE_ENV })'
              );
            }
          } else {
            // Generic import.meta → {}
            path.replaceWithSourceString('({})');
          }
        }
      },
    },
  };
};
