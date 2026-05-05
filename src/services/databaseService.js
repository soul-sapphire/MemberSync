import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

/**
 * Triggers the backend function to populate the database with demo data.
 * @param {string} organizationId - The organization ID to seed.
 * @returns {Promise<Object>} - The result of the population.
 */
export const populateDatabase = async (organizationId = "default") => {
  try {
    const callable = httpsCallable(functions, "populateDatabase");
    const result = await callable({ organizationId });
    return result.data;
  } catch (error) {
    console.error("populateDatabase error:", error);
    throw error;
  }
};
