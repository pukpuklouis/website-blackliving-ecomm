// Custom ESM loader to handle cloudflare: protocol
export function resolve(specifier, context, defaultResolve) {
  // Handle cloudflare: protocol by treating it as a built-in module
  if (specifier.startsWith("cloudflare:")) {
    return {
      url: specifier,
      shortCircuit: true,
    };
  }

  return defaultResolve(specifier, context);
}

export function load(url, context, defaultLoad) {
  // Handle cloudflare: protocol modules
  if (url.startsWith("cloudflare:")) {
    return {
      format: "module",
      source: "export default {};",
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context);
}
