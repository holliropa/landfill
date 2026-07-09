export function getAvailableFileName(
  originalName: string,
  usedNames: Set<string>,
) {
  if (!usedNames.has(normalizeFileNameKey(originalName))) {
    usedNames.add(normalizeFileNameKey(originalName));
    return originalName;
  }

  const { baseName, extension } = splitFileName(originalName);

  for (let copyNumber = 1; ; copyNumber++) {
    const candidate = `${baseName} (${copyNumber})${extension}`;
    const candidateKey = normalizeFileNameKey(candidate);

    if (!usedNames.has(candidateKey)) {
      usedNames.add(candidateKey);
      return candidate;
    }
  }
}

export function getAvailableFolderName(name: string, usedNames: Set<string>) {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  for (let copyNumber = 1; ; copyNumber++) {
    const candidate = `${name} (${copyNumber})`;

    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
  }
}

export function normalizeFileNameKey(fileName: string) {
  return fileName.toLocaleLowerCase();
}

function splitFileName(fileName: string) {
  const extensionStart = fileName.lastIndexOf(".");

  if (extensionStart <= 0) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, extensionStart),
    extension: fileName.slice(extensionStart),
  };
}
