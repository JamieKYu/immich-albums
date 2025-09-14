import type { NextConfig } from "next";
import fs from 'fs';

// Default fallback configuration
const FALLBACK_CONFIG = {
  NEXT_PUBLIC_HEADER_ALWAYS_VISIBLE: 'true',
  NEXT_PUBLIC_HEADER_TITLE: 'immich-albums',
  NEXT_PUBLIC_HEADER_TITLE_HREF: '/',
  NEXT_PUBLIC_HEADER_NAV_ITEMS: JSON.stringify([])
};

// Load header config and set as environment variables
function loadHeaderConfig() {
  const configPath = './config/header-config.json';

  try {
    console.log('Attempting to read config from:', configPath);
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('Successfully loaded header config:', configData);

    // Check if configData is empty or invalid, use fallback values
    const hasValidConfig = configData && typeof configData === 'object' &&
      (configData.title || configData.alwaysVisible !== undefined || configData.navigationItems);

    if (!hasValidConfig) {
      console.log('Config file exists but is empty or invalid, using fallback values');
      return FALLBACK_CONFIG;
    }

    const envVars = {
      NEXT_PUBLIC_HEADER_ALWAYS_VISIBLE: configData.alwaysVisible?.toString() || 'false',
      NEXT_PUBLIC_HEADER_TITLE: configData.title || '',
      NEXT_PUBLIC_HEADER_TITLE_HREF: configData.titleHref || '/',
      NEXT_PUBLIC_HEADER_NAV_ITEMS: JSON.stringify(configData.navigationItems || [])
    };

    console.log('Setting environment variables:', envVars);
    return envVars;
  } catch (error) {
    console.warn(`Failed to load header config from ${configPath}:`, error);
    console.log('Using fallback header config values');
    return FALLBACK_CONFIG;
  }
}

const headerConfig = loadHeaderConfig();
console.log('Final header config:', headerConfig);

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/photos',
  assetPrefix: '/photos',
  trailingSlash: true,
  env: {
    ...headerConfig
  }
};

export default nextConfig;
