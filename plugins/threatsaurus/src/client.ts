import config from "config";
import fetch from "node-fetch";

const opts: any = {
  baseUrl: config.get("data._providers.threatsaurus.baseUrl"),
};

interface ThreatsaurusIndex {
  [key: string]: string;
}

/**
 * List of all Threatsaurus supported techs
 * @returns
 */
export async function fetchIndex(): Promise<ThreatsaurusIndex> {
  const url = `${opts.baseUrl}/index.json`;
  const res = await fetch(url);
  return await res.json();
}

export interface ThreatsaurusThreat {
  // Should be semi-static, to avoid duplicate suggestions on the same component.
  slug: string;

  /**
   * Short title of the suggested threat
   */
  title: string;

  /**
   * Description that summarizes the control. Link to documentation if more than a few sentences is needed.
   */
  description: string;
}

export interface ThreatsaurusControl {
  // Should be semi-static, to avoid duplicate suggestions on the same component.
  slug: string;

  /**
   * Short title of the suggested threat
   */
  title: string;

  /**
   * Description that summarizes the control. Link to documentation if more than a few sentences is needed.
   */
  description: string;

  mitigates: string[];
}

export interface ThreatsaurusSuggestions {
  threats: ThreatsaurusThreat[];
  controls: ThreatsaurusControl[];
}

/**
 * Fetch suggestions from Threatsaurus for a specific tech
 * @param key
 * @returns
 */
export async function fetchTech(
  key: string
): Promise<null | ThreatsaurusSuggestions> {
  const url = `${opts.baseUrl}/${key}`;
  const res = await fetch(url);
  if (res.status !== 200) {
    return null;
  }
  return await res.json();
}
