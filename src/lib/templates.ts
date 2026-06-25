import type { Prisma } from "@/generated/prisma/client";

const PRODUCT_BRIEF =
  "Product: Wireless Bluetooth Headphones, Features: Noise cancellation, 30 hour battery, Foldable design.";

const GEMINI_MODEL = "gemini-3-flash-preview";
const SETTINGS = { temperature: 1, maxOutputTokens: 2048 };

// The "Trial Task Workflow" from the submission reference: a marketing-post pipeline.
// Request inputs fan out to a 3-stage Gemini chain and two parallel crops; the Response
// node collects the final Gemini post and one crop.
export const TRIAL_TASK_WORKFLOW = {
  name: "Trial Task Workflow",
  graph: {
    nodes: [
      {
        id: "request-inputs",
        type: "request-inputs",
        position: { x: 40, y: 380 },
        deletable: false,
        data: {
          fields: [
            { id: "text_field", name: "text_field", type: "text", value: PRODUCT_BRIEF },
            { id: "image_field", name: "image_field", type: "image" },
          ],
        },
      },
      {
        id: "gemini-description",
        type: "gemini",
        position: { x: 400, y: 40 },
        data: {
          model: GEMINI_MODEL,
          systemPrompt: "You are a marketing copywriter. Write a one-paragraph product description.",
          settings: SETTINGS,
        },
      },
      {
        id: "gemini-tweet",
        type: "gemini",
        position: { x: 760, y: 80 },
        data: {
          model: GEMINI_MODEL,
          systemPrompt:
            "Condense the following product description into a tweet-length hook (under 240 characters).",
          settings: SETTINGS,
        },
      },
      {
        id: "gemini-post",
        type: "gemini",
        position: { x: 1140, y: 360 },
        data: {
          model: GEMINI_MODEL,
          systemPrompt:
            "You are a social media manager. Combine the tweet hook and the two product crops into a final marketing post.",
          settings: SETTINGS,
        },
      },
      {
        id: "crop-top",
        type: "crop-image",
        position: { x: 400, y: 430 },
        data: { x: 20, y: 20, width: 60, height: 60 },
      },
      {
        id: "crop-bottom",
        type: "crop-image",
        position: { x: 400, y: 720 },
        data: { x: 0, y: 0, width: 50, height: 100 },
      },
      {
        id: "response",
        type: "response",
        position: { x: 1540, y: 540 },
        deletable: false,
        data: {},
      },
    ],
    edges: [
      edge("request-inputs", "text_field", "gemini-description", "prompt"),
      edge("gemini-description", "response", "gemini-tweet", "prompt"),
      edge("gemini-tweet", "response", "gemini-post", "prompt"),
      edge("request-inputs", "image_field", "crop-top", "input-image"),
      edge("request-inputs", "image_field", "crop-bottom", "input-image"),
      edge("crop-top", "output-image", "gemini-post", "image"),
      edge("crop-bottom", "output-image", "response", "result"),
      edge("gemini-post", "response", "response", "result"),
    ],
  },
} satisfies { name: string; graph: { nodes: unknown[]; edges: unknown[] } };

function edge(source: string, sourceHandle: string, target: string, targetHandle: string) {
  return {
    id: `${source}.${sourceHandle}->${target}.${targetHandle}`,
    source,
    sourceHandle,
    target,
    targetHandle,
  };
}

export const trialTaskGraph = TRIAL_TASK_WORKFLOW.graph as unknown as Prisma.InputJsonValue;
