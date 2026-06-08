// subtitle/cmd.js

import { ok } from "../infra/protocol.js";
import { adjustAssTimeline } from "./ass.js";

// CLI 命令注册表
export const ASS_COMMANDS = {
  time: {
    handler: cmd_adjustAssTimeline,
    usage: "ass time <file|dir> <delta>",
    description:
      "Adjust ASS subtitles by delta seconds (can be positive or negative)",
    mainOptions: "<file|dir> <delta>",
    advancedOptions: "",
  },
};

// CLI 命令实现
export async function cmd_adjustAssTimeline(ctx) {
  const { argv, options } = ctx;
  const [input, delta] = argv;

  return ok(adjustAssTimeline(input, delta, options));
}
