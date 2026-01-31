/**
 * Search Services Public API
 */

// Export API functions
export * from "./search.api";

// Export service functions with explicit names to avoid conflicts
export {
  search as searchService,
  globalSearch as globalSearchService,
  searchByBarcode as searchByBarcodeService,
} from "./search.service";
