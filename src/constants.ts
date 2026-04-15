import { BodyType } from "./types";

export const BODY_TYPE_DESCRIPTIONS: Record<BodyType, string> = {
  'Hourglass': 'Your bust and hips are approximately the same width, with a clearly defined waist that is significantly narrower.',
  'Pear': 'Your hips are wider than your bust, and you have a well-defined waist.',
  'Apple': 'You have a broader upper body (bust and shoulders) with a less defined waistline and slimmer legs.',
  'Rectangle': 'Your bust, waist, and hips are fairly uniform in width, creating a straight silhouette.',
  'Inverted Triangle': 'Your shoulders or bust are wider than your hips, often with a subtle waist definition.',
  'Unknown': 'We couldn\'t determine your body type. Please check your measurements.'
};
