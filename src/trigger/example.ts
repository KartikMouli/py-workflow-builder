import { task } from "@trigger.dev/sdk";

export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message?: string }) => {
    const message = payload.message ?? "world";
    return { greeting: `Hello, ${message}!` };
  },
});
