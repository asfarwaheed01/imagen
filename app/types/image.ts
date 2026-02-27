export type EditingStyle = {
  id: string;
  label: string;
  prompt: string;
};

export const EDITING_STYLES: EditingStyle[] = [
  {
    id: "day-to-night",
    label: "Day to Night",
    prompt:
      "Convert this real estate property photo to a stunning night scene with warm glowing lights, a dark sky, and professional marketing quality.",
  },
  {
    id: "enhance",
    label: "Enhance Lighting",
    prompt:
      "Enhance the lighting of this real estate photo to make it look bright, warm, and professionally photographed for marketing.",
  },
  {
    id: "sky-replace",
    label: "Sky Replacement",
    prompt:
      "Replace the sky in this real estate photo with a beautiful blue sky with soft clouds for a perfect marketing image.",
  },
  {
    id: "twilight",
    label: "Twilight",
    prompt:
      "Transform this real estate photo into a golden hour twilight shot with warm orange and purple tones in the sky.",
  },
];
