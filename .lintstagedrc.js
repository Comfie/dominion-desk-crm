module.exports = {
  // Lint and format TypeScript and JavaScript files
  '**/*.{js,jsx,ts,tsx}': (filenames) => [
    `npx eslint --fix --no-warn-ignored ${filenames.join(' ')}`,
    `npx prettier --write ${filenames.join(' ')}`,
  ],

  // Format other file types
  '**/*.{json,md,yml,yaml,css,scss}': (filenames) => `npx prettier --write ${filenames.join(' ')}`,
};
