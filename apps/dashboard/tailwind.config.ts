import type { Config } from "tailwindcss";
import sharedConfig from "@saasfly/tailwind-config";

const config: Pick<Config, "content" | "presets"> = {
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [sharedConfig],
};

export default config;
