const fs = require('fs');
const path = require('path');

function loadCommands(commandsDir) {
  const files = fs
    .readdirSync(commandsDir)
    .filter((file) => file.endsWith('.js') && file !== 'loadCommands.js' && !file.startsWith('_'));

  const commands = [];
  const lookup = new Map();

  for (const file of files) {
    const commandPath = path.join(commandsDir, file);
    const command = require(commandPath);

    if (!command?.name || typeof command.execute !== 'function') {
      throw new Error(`Invalid command module: ${file}`);
    }

    const normalizedName = command.name.toLowerCase();
    if (lookup.has(normalizedName)) {
      throw new Error(`Duplicate command name: ${command.name}`);
    }

    commands.push(command);
    lookup.set(normalizedName, command);

    for (const alias of command.aliases || []) {
      const normalizedAlias = alias.toLowerCase();

      if (lookup.has(normalizedAlias)) {
        throw new Error(`Duplicate command alias: ${alias}`);
      }

      lookup.set(normalizedAlias, command);
    }
  }

  commands.sort((left, right) => {
    if (left.category !== right.category) {
      return left.category.localeCompare(right.category);
    }

    return left.name.localeCompare(right.name);
  });

  return {
    commands,
    get(name) {
      return lookup.get((name || '').toLowerCase()) || null;
    },
  };
}

module.exports = {
  loadCommands,
};
